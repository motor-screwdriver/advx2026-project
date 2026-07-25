package mifit

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"time"
)

func parseLegacyDay(date, encoded string) (SleepSession, bool, error) {
	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return SleepSession{}, false, err
	}
	var summary legacySummary
	if err := json.Unmarshal(raw, &summary); err != nil {
		return SleepSession{}, false, err
	}
	if summary.Sleep == nil {
		return SleepSession{}, false, nil
	}
	sleep := summary.Sleep
	if sleep.Start <= 0 || sleep.End <= sleep.Start {
		return SleepSession{}, false, errors.New("invalid sleep start/end")
	}
	offset := summary.Timezone
	location := time.FixedZone(offsetName(offset), offset)
	duration := sleep.Deep + sleep.Light
	elapsed := int((sleep.End - sleep.Start) / 60)
	awake := elapsed - duration
	if awake < 0 {
		awake = 0
	}
	return SleepSession{
		Provider: ProviderHuamiLegacy, ExternalID: "huami-legacy_" + date,
		Start:           time.Unix(sleep.Start, 0).In(location),
		End:             time.Unix(sleep.End, 0).In(location),
		DurationMinutes: duration, AwakeMinutes: awake, IsNap: false,
		Timezone: offsetName(offset), UTCOffsetSeconds: offset,
		Stages: legacyStages(sleep.Stages),
	}, true, nil
}

type legacySummary struct {
	Timezone int          `json:"tz"`
	Sleep    *legacySleep `json:"slp"`
}

type legacySleep struct {
	Start  int64         `json:"st"`
	End    int64         `json:"ed"`
	Deep   int           `json:"dp"`
	Light  int           `json:"lt"`
	Stages []legacyStage `json:"stage"`
}

type legacyStage struct {
	Start int `json:"start"`
	Stop  int `json:"stop"`
	End   int `json:"end"`
	Mode  int `json:"mode"`
}

func legacyStages(source []legacyStage) []SleepStage {
	result := make([]SleepStage, 0, len(source))
	for _, stage := range source {
		end := stage.Stop
		if end == 0 {
			end = stage.End
		}
		minutes := end - stage.Start
		if minutes < 0 {
			minutes += 24 * 60
		}
		name := "unknown"
		if stage.Mode == 4 {
			name = "light"
		} else if stage.Mode == 5 {
			name = "deep"
		}
		if minutes > 0 {
			result = append(result, SleepStage{Name: name, Minutes: minutes})
		}
	}
	return result
}
