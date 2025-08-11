#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="./curl-report"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/report.json"
PORT=${PORT:-3000}

# Start server with in-memory DB
export USE_PG_MEM=true
export NODE_ENV=test
export SESSION_SECRET=0123456789abcdef0123456789abcdef
export CORS_ORIGIN=http://127.0.0.1:5173

node ./dist/server.js &
APP_PID=$!
trap 'kill $APP_PID 2>/dev/null || true' EXIT

wait_for() {
  for i in {1..60}; do
    if curl -s "http://127.0.0.1:$PORT/auth/captcha" >/dev/null; then
      return 0
    fi
    sleep 0.5
  done
  echo "Server did not start" >&2
  exit 1
}

wait_for

JQ='{ "steps": [] }'
append_step() {
  local name="$1"; shift
  local status="$1"; shift
  local info="$1"; shift || true
  JQ=$(echo "$JQ" | jq --arg n "$name" --arg s "$status" --arg i "$info" '.steps += [{name:$n,status:$s,info:$i}]')
}

# Captcha
CAP_RESP=$(curl -s -D - http://127.0.0.1:$PORT/auth/captcha)
CAPTCHA=$(echo "$CAP_RESP" | tail -n1 | jq -r '.captcha')
CAP_COOKIE=$(echo "$CAP_RESP" | sed -n 's/^set-cookie: \(.*\)$/\1/ip' | tr -d '\r')
append_step "captcha" "ok" "$CAPTCHA"

# Signup user
USERNAME="curl_$(date +%s)"
SIGNUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $CAP_COOKIE" -d "{\"username\":\"$USERNAME\",\"fullname\":\"Curl User\",\"email\":\"$USERNAME@example.com\",\"password\":\"User@1234\",\"mobile\":\"7894561230\",\"captcha\":\"$CAPTCHA\"}" http://127.0.0.1:$PORT/auth/signup)
append_step "signup" "$SIGNUP_CODE" "user:$USERNAME"

# Login as new user
LOGIN_RESP=$(curl -s -D - -H 'content-type: application/json' -d "{\"username\":\"$USERNAME\",\"password\":\"User@1234\"}" http://127.0.0.1:$PORT/auth/login)
USER_COOKIE=$(echo "$LOGIN_RESP" | sed -n 's/^set-cookie: \(.*\)$/\1/ip' | tr -d '\r')
append_step "login-user" "ok" "$USER_COOKIE"

# Login as admin
ADMIN_RESP=$(curl -s -D - -H 'content-type: application/json' -d '{"username":"ADMIN2","password":"Admin@1234"}' http://127.0.0.1:$PORT/auth/login)
ADMIN_COOKIE=$(echo "$ADMIN_RESP" | sed -n 's/^set-cookie: \(.*\)$/\1/ip' | tr -d '\r')
append_step "login-admin" "ok" "$ADMIN_COOKIE"

# Create hall
HALL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $ADMIN_COOKIE" -d '{"name":"Curl Hall","total_columns":10,"total_rows":8}' http://127.0.0.1:$PORT/halls)
HALLS=$(curl -s http://127.0.0.1:$PORT/halls)
HALL_ID=$(echo "$HALLS" | jq '.halls[] | select(.name=="Curl Hall") | .hall_id')
append_step "create-hall" "$HALL_CODE" "id:$HALL_ID"

# Create movie
MOV_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $ADMIN_COOKIE" -d '{"name":"Curl Movie","ticket_price":180}' http://127.0.0.1:$PORT/movies)
MOVIES=$(curl -s http://127.0.0.1:$PORT/movies)
MOV_ID=$(echo "$MOVIES" | jq '.movies[] | select(.name=="Curl Movie") | .movieId')
append_step "create-movie" "$MOV_CODE" "id:$MOV_ID"

# Update movie
UPD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $ADMIN_COOKIE" -X PUT -d "{\"id\":$MOV_ID,\"name\":\"Curl Movie 2\",\"ticket_price\":200}" http://127.0.0.1:$PORT/movies)
append_step "update-movie" "$UPD_CODE" "id:$MOV_ID"

# Create show tonight 21:00:00
DATE=$(date +%F)
SHOW_TIME="$DATE 21:00:00"
SHOW_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $ADMIN_COOKIE" -d "{\"movie_id\":$MOV_ID,\"hall_id\":$HALL_ID,\"show_time\":\"$SHOW_TIME\"}" http://127.0.0.1:$PORT/shows)
append_step "create-show" "$SHOW_CODE" "time:$SHOW_TIME"

# List shows
SHOWS=$(curl -s http://127.0.0.1:$PORT/shows)
append_step "list-shows" "ok" "$(echo "$SHOWS" | jq -c '.')"

# Show availability for movie/day
SHOWTIME=$(curl -s -G --data-urlencode "id=$MOV_ID" --data-urlencode "date=$DATE" http://127.0.0.1:$PORT/movies/showtime)
append_step "movie-showtime" "ok" "$(echo "$SHOWTIME" | jq -c '.')"

# Book tickets concurrently to test race conditions
book() {
  local seats="$1"
  curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $USER_COOKIE" -d "{\"show_id\":$MOV_ID,\"sequence_numbers\":\"$seats\"}" http://127.0.0.1:$PORT/bookings/booktickets
}

C1=$(book "1,2") &
C2=$(book "2,3") &
wait || true
# Try again after
C3=$(book "2")
append_step "bookings-concurrent" "ok" "C1:$C1 C2:$C2 C3:$C3"

# List user bookings
USER_BOOKINGS=$(curl -s -H "cookie: $USER_COOKIE" http://127.0.0.1:$PORT/bookings)
append_step "list-bookings" "ok" "$(echo "$USER_BOOKINGS" | jq -c '.')"

# Extract a booking and checkin
BID=$(echo "$USER_BOOKINGS" | jq -r '.bookings[0].booking_id')
UID=$(echo "$USER_BOOKINGS" | jq -r '.bookings[0].user_id')
CHK1=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $USER_COOKIE" -d "{\"qr_data\":\"$UID:$BID\"}" http://127.0.0.1:$PORT/bookings/checkin)
CHK2=$(curl -s -o /dev/null -w "%{http_code}" -H 'content-type: application/json' -H "cookie: $USER_COOKIE" -d "{\"qr_data\":\"$UID:$BID\"}" http://127.0.0.1:$PORT/bookings/checkin)
append_step "checkin" "ok" "first:$CHK1 second:$CHK2"

# Save report
echo "$JQ" | jq '.' > "$REPORT_FILE"
echo "Report saved to $REPORT_FILE"