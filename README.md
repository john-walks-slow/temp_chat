# temp

a chat room that exists for one random hour each day

## the premise

communication is impossible. we built this to prove it.

every 24 hours, the room opens for a random duration between 5 and 60 minutes. no one knows when. no one knows how long. you might miss it entirely. you might arrive alone. you might find strangers who disappear forever.

## usage

```
npm install
npm start
```

visit http://localhost:3000

## the rules

- the room opens once per day
- duration: 5-60 minutes (random)
- no history
- no names
- no promises

## technical details

built with:
- node.js
- websockets
- the futility of human connection

## testing

```
NODE_ENV=test npx playwright test
```

tests verify that the room opens, closes, and forgets everything

## license

do what you want. nothing matters anyway.