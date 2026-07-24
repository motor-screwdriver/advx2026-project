# Mi Fitness API probe

This is a read-only diagnostic utility for checking whether sleep data can be
retrieved directly from Xiaomi's cloud without Google services or an analytics
intermediary.

It supports two separate providers:

- `mifitness` — the current Mi Fitness/Xiaomi Wear app
  (`com.xiaomi.wearable`). This is the production candidate.
- `huami-legacy` — the old Mi Fit API used by Zepp Life
  (`com.xiaomi.hm.health`). It exists only to reproduce the Python script from
  `micw/hacking-mifit-api`; success here does not prove that Mi Fitness works.

Only use the probe with your own Xiaomi/Zepp account. The APIs are unofficial,
can change without notice, and the returned fitness information is not medical
data.

## Run the unit tests

With Go 1.24 installed:

```bash
cd backend
go test ./...
```

From the repository root, using Docker instead:

```bash
docker run --rm \
  -v "$PWD/backend:/src" -w /src golang:1.24 \
  sh -c 'export PATH=/usr/local/go/bin:$PATH; go test ./...'
```

The repository's full `pnpm run check` currently has an unrelated pre-existing
failure: the generated `assets/manifest.ts` exceeds ESLint's 250-line limit.
The Mi Fitness spike does not modify that generated asset.

## Live smoke test: modern Mi Fitness

First open Mi Fitness on the phone and let the watch finish syncing. Then run:

```bash
cd backend
go run ./cmd/mifit-probe \
  --provider mifitness \
  --region cn \
  --timezone Europe/Moscow \
  --require-sleep
```

The CLI prompts for the Xiaomi login and hides password input. It queries the
last 14 calendar days by default. Use explicit dates when necessary:

```bash
go run ./cmd/mifit-probe \
  --provider mifitness \
  --region cn \
  --from 2026-07-01 \
  --to 2026-07-24 \
  --timezone Europe/Moscow \
  --json \
  --require-sleep
```

For non-interactive use, provide secrets through the environment, never through
command-line flags (which are visible in shell history and process lists):

```bash
export MIFIT_USERNAME='user@example.com'
read -rs MIFIT_PASSWORD
export MIFIT_PASSWORD

go run ./cmd/mifit-probe --provider mifitness --region cn --require-sleep

unset MIFIT_PASSWORD
```

If Xiaomi requests email confirmation, the interactive probe requests a code
in the same Xiaomi identity session and prompts:

```text
Xiaomi requires email verification; requesting a one-time code...
Xiaomi email code:
```

Enter the code from Xiaomi's email. Do not open the old `notificationUrl` in a
separate browser: its identity context is bound to the probe's cookies and the
page can fail with `Something went wrong`.

### Reusing authorization

After the first successful login, the probe saves `ssecurity` and Xiaomi
session cookies in the operating system's user config directory. On Linux the
default is:

```text
~/.config/8bit-sleep/mifit-auth.json
```

The file is created with permissions `0600`. It contains secrets equivalent to
an active Xiaomi session, but never the password or email verification code.
Do not commit or share it.

The first run prints `Saved Xiaomi session: ...`; later runs print
`Using saved Xiaomi session: ...` and do not ask for login, password, or an
email code. Useful flags:

```bash
# Ignore an expired cache and authenticate again.
go run ./cmd/mifit-probe --provider mifitness --region cn --reauth

# Select a cache location explicitly.
go run ./cmd/mifit-probe --provider mifitness --region cn \
  --auth-cache /secure/path/mifit-auth.json

# Run without loading or saving authorization.
go run ./cmd/mifit-probe --provider mifitness --region cn --no-auth-cache
```

For non-interactive verification, set `MIFIT_VERIFICATION_CODE` alongside
`MIFIT_USERNAME` and `MIFIT_PASSWORD`. If email verification is unavailable or
Xiaomi requests another challenge type, log in at `https://account.xiaomi.com`,
obtain the `userId` and `passToken` cookies from your own browser session, and
use:

```bash
export MIFIT_USER_ID='...'
read -rs MIFIT_PASS_TOKEN
export MIFIT_PASS_TOKEN

go run ./cmd/mifit-probe --provider mifitness --region cn --require-sleep

unset MIFIT_PASS_TOKEN
```

For the selected test setup, use `cn`: the account country is Russia, while Mi
Fitness is configured for the China Mainland server. The probe also supports
`de`, `i2`, `ru`, `sg`, and `us` when the profile is stored in those IDCs.

Docker can run the interactive probe as well:

```bash
docker run --rm -it \
  -v "$PWD/backend:/src" -w /src golang:1.24 \
  sh -c 'export PATH=/usr/local/go/bin:$PATH; go run ./cmd/mifit-probe \
    --provider mifitness --region cn --require-sleep'
```

## Live smoke test: legacy Mi Fit / Zepp Life

This test uses a Zepp Life/Mi Fit account and the old Huami endpoints:

```bash
cd backend
go run ./cmd/mifit-probe \
  --provider huami-legacy \
  --from 2026-07-01 \
  --to 2026-07-24 \
  --require-sleep
```

Interactive prompts are used by default. The non-interactive variables are
`MIFIT_LEGACY_EMAIL` and `MIFIT_LEGACY_PASSWORD`.

## What each Mi Fitness request does

The implementation is in `internal/mifit/modern.go` and
`internal/mifit/modern_request.go`.

1. `GET account.xiaomi.com/pass/serviceLogin?...&sid=miothealth`
   obtains `_sign`, `qs`, `sid`, and `callback` required by Xiaomi Account.
2. `POST account.xiaomi.com/pass/serviceLoginAuth2` sends a URL-encoded form.
   `hash` is the uppercase MD5 required by Xiaomi's login protocol. HTTPS still
   protects the transport. The plaintext password is neither retained nor
   logged. A direct success contains `ssecurity`, `userId`, `passToken`, and a
   one-time STS `location`.
3. If the response contains `notificationUrl`, the probe keeps the same cookie
   jar, calls `identity/list` and `identity/auth/sendEmailTicket`, then asks for
   the one-time email code. `identity/auth/verifyEmail`,
   `identity/result/check`, and `serviceLoginAuth2/end` finish the challenge.
4. `GET location` obtains the short-lived session cookies. The password and
   email code are no longer needed after this step.
5. `POST https://hlth.io.mi.com/app/v1/data/get_fitness_data_by_time` requests:

   ```json
   {
     "start_time": 1761000000,
     "end_time": 1761086399,
     "key": "sleep"
   }
   ```

   The request uses a fresh nonce. `ssecurity + nonce` produces a SHA-256
   per-request key. `data` and `rc4_hash__` are RC4-encrypted after discarding
   the first 1024 keystream bytes. `signature` signs the encrypted values.

6. The response body is base64-decoded, RC4-decrypted, checked for Xiaomi's
   result code, paginated through `next_key`, and normalized into
   `SleepSession`.

The legacy implementation in `internal/mifit/legacy.go` performs the three
calls from the original Python sample: Huami redirect token, Huami app
credentials, then `band_data.json`. Each day's base64 `summary` is decoded and
the `slp` block is normalized.

## Exit codes and troubleshooting

| Code | Meaning                                                        |
| ---: | -------------------------------------------------------------- |
|  `0` | Request and decoding succeeded                                 |
|  `2` | Invalid flags, region, timezone, or missing credentials        |
|  `3` | Authentication/session rejected                                |
|  `4` | Network, timeout, HTTP, or remote API error                    |
|  `5` | Response, encryption, pagination, or schema decoding error     |
|  `6` | `--require-sleep` was set, but no sleep sessions were returned |

The probe handles Xiaomi's email verification inside the original HTTP
session. If no email arrives, wait before retrying so Xiaomi does not
rate-limit the account. Captcha and phone-only challenges are reported as
unsupported; use the `userId + passToken` fallback in that case.

Older builds could print `Xiaomi authentication: 成功` ("success") when Xiaomi
returned a verification response without session credentials. The current
probe preserves account cookies across all login and email-verification steps.

Code 6 usually means the device has not synced yet, the date range is wrong, or
the selected region does not contain this account's data. Run once without
`--require-sleep` to distinguish a valid empty response from decoding failure.

To compare likely data sources without printing health values:

```bash
go run ./cmd/mifit-probe \
  --provider mifitness \
  --region cn \
  --timezone Europe/Moscow \
  --from 2026-06-24 \
  --to 2026-07-24 \
  --diagnose
```

The result contains only endpoint names, requested keys, record counts, and
safe errors.

### TLS timeout to the China server

`TLS handshake timeout` is code 4: authorization succeeded, but the machine
could not establish HTTPS with `hlth.io.mi.com`. The probe now allows a
30-second TLS handshake and retries one transient read-only Health Cloud
request. Test the route independently:

```bash
curl -4 -I --connect-timeout 30 https://hlth.io.mi.com/
```

Any HTTP response proves that DNS, TCP, and TLS work; the status itself may be
404 or 405. If curl also times out, changing API code cannot fix that network
route. Use a network that can reach Xiaomi's China IDC. If a local proxy is
already available, Go honors the standard environment variable:

```bash
HTTPS_PROXY=http://127.0.0.1:7890 \
  go run ./cmd/mifit-probe --provider mifitness --region cn --diagnose
```

## Sources and licensing

The protocol was independently implemented in Go using these MIT-licensed
research projects as references:

- <https://github.com/AlexxIT/SmartScaleConnect>
- <https://github.com/binglua/mi-fitness-mcp-cn>
- <https://github.com/PiotrMachowski/Xiaomi-cloud-tokens-extractor>

The legacy behavior follows:

- <https://github.com/micw/hacking-mifit-api>

No source project is contacted at runtime. Live requests go directly to Xiaomi
or Huami endpoints.
