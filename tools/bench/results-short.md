# pota bench — short history

Compact log of `npm run bench` runs. Newest entry at the top.

## 0.20.232 (dirty) @ 531d54e — Chrome/147.0.7727.57

- 10k `63.26ms` clear `8.35ms`
- 1k `4.42ms` clear `0.64ms`
- per-row `654B` full `7475KB` leak `34KB`
- deopts `10/11`

## 0.20.232 (dirty) @ 531d54e — Chrome/147.0.7727.57

- 10k `65.66ms` clear `8.13ms`
- 1k `5.43ms` clear `0.70ms`
- per-row `655B` full `7481KB` leak `21KB`
- deopts `10/11`

## old stuff

- v0.17.177 win - pos 31 / 10k - 75ms - 11ms / 1k - 7ms - 0.7ms
- v0.18.188 win - pos 34 / 10k - 77ms - 9ms / 1k - 7ms - 0.5ms
- v0.18.199 lin - pos Xx / 10k - 54ms - 6ms / 1k - 4.5ms - 0.4ms
- v0.19.204 lin - pos 24 / 10k - 38ms - 4ms / 1k - 4ms - 0.25ms
- v0.19.206 lin - pos 21 / 10k - 38ms - 4ms / 1k - 3ms - 0.25ms
- v0.20.224 lin - pos 18 / 10k - 41ms - 4ms / 1k - 3ms - 0.25ms
- v0.20.227 lin - pos 18 / 10k - 51ms - 7ms / 1k - 6ms - 0.6ms
