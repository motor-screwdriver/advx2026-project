package mifit

import (
	"errors"
	"fmt"
)

// ErrorKind lets the CLI return stable exit codes without inspecting text.
type ErrorKind int

const (
	KindUnknown ErrorKind = iota
	KindConfig
	KindAuth
	KindTransport
	KindDecode
)

// Error carries a safe operation name and never embeds credentials.
type Error struct {
	Kind ErrorKind
	Op   string
	Err  error
}

func (e *Error) Error() string {
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

func (e *Error) Unwrap() error {
	return e.Err
}

func wrap(kind ErrorKind, op string, err error) error {
	if err == nil {
		return nil
	}
	return &Error{Kind: kind, Op: op, Err: err}
}

// KindOf returns KindUnknown for errors not produced by this package.
func KindOf(err error) ErrorKind {
	var target *Error
	if errors.As(err, &target) {
		return target.Kind
	}
	return KindUnknown
}
