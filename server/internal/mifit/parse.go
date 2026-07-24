package mifit

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"
)

func parseModernSleep(items []modernDataItem) ([]SleepSession, error) {
	sessions := make([]SleepSession, 0, len(items))
	for index, item := range items {
		value, err := decodeModernValue(item.Value)
		if err != nil {
			return nil, wrap(KindDecode, "decode Mi Fitness sleep item",
				fmt.Errorf("item %d: %w", index, err))
		}
		start := firstInt64(value, "bedtime", "device_bedtime", "bed_timestamp",
			"deviceBedTime")
		end := firstInt64(value, "wake_up_time", "device_wake_up_time",
			"out_bed_timestamp", "deviceWakeupTime")
		if end == 0 {
			end = item.Time
		}
		if start <= 0 || end <= start {
			return nil, wrap(KindDecode, "decode Mi Fitness sleep item",
				fmt.Errorf("item %d has invalid bedtime/wakeup", index))
		}
		zoneName := item.ZoneName
		if zoneName == "" {
			zoneName = offsetName(item.ZoneOffset)
		}
		location := time.FixedZone(zoneName, item.ZoneOffset)
		duration := int(firstInt64(value, "duration"))
		if duration <= 0 {
			duration = int((end - start) / 60)
		}
		awake := int(firstInt64(value, "awake_duration", "sleep_awake_duration"))
		externalID := item.SID
		if externalID == "" {
			externalID = "unknown"
		}
		externalID += "_" + strconv.FormatInt(item.Time, 10)
		sessions = append(sessions, SleepSession{
			Provider: ProviderMiFitness, ExternalID: externalID,
			Start: time.Unix(start, 0).In(location), End: time.Unix(end, 0).In(location),
			DurationMinutes: duration, AwakeMinutes: awake,
			Score:    optionalInt(value, "score", "sleep_score"),
			IsNap:    firstBool(value, "is_nap", "isNap"),
			Timezone: zoneName, UTCOffsetSeconds: item.ZoneOffset,
			Stages: parseModernStages(value),
		})
	}
	return sessions, nil
}

func decodeModernValue(raw json.RawMessage) (map[string]any, error) {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 || bytes.Equal(raw, []byte("null")) {
		return nil, errors.New("empty value")
	}
	if raw[0] == '"' {
		var encoded string
		if err := json.Unmarshal(raw, &encoded); err != nil {
			return nil, err
		}
		raw = []byte(encoded)
	}
	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		return nil, err
	}
	return value, nil
}

func parseModernStages(value map[string]any) []SleepStage {
	raw, ok := value["items"].([]any)
	if !ok {
		return nil
	}
	stages := make([]SleepStage, 0, len(raw))
	for _, entry := range raw {
		item, ok := entry.(map[string]any)
		if !ok {
			continue
		}
		start := firstInt64(item, "start_time", "start")
		end := firstInt64(item, "end_time", "end")
		if end <= start {
			continue
		}
		stages = append(stages, SleepStage{
			Name:    modernStageName(firstInt64(item, "state", "mode")),
			Minutes: int((end - start) / 60),
		})
	}
	return stages
}

func modernStageName(state int64) string {
	switch state {
	case 1:
		return "deep"
	case 2, 3:
		return "light"
	case 4:
		return "awake"
	case 5:
		return "rem"
	default:
		return "unknown"
	}
}

func firstInt64(values map[string]any, keys ...string) int64 {
	for _, key := range keys {
		switch value := values[key].(type) {
		case float64:
			return int64(value)
		case json.Number:
			result, _ := value.Int64()
			return result
		case string:
			result, _ := strconv.ParseInt(value, 10, 64)
			return result
		}
	}
	return 0
}

func optionalInt(values map[string]any, keys ...string) *int {
	for _, key := range keys {
		if _, ok := values[key]; !ok {
			continue
		}
		value := int(firstInt64(values, key))
		return &value
	}
	return nil
}

func firstBool(values map[string]any, keys ...string) bool {
	for _, key := range keys {
		switch value := values[key].(type) {
		case bool:
			return value
		case float64:
			return value != 0
		case string:
			result, _ := strconv.ParseBool(value)
			return result
		}
	}
	return false
}

func offsetName(seconds int) string {
	sign := "+"
	if seconds < 0 {
		sign, seconds = "-", -seconds
	}
	return fmt.Sprintf("UTC%s%02d:%02d", sign, seconds/3600, seconds%3600/60)
}
