# v0.4 cloud continuation handoff

This branch is a migration candidate, NOT a deployed release. Continue in cloud environment `elvin-reading-room`, repository `elvinnnnnwu/elvin-reading-room`.

## Completed candidate
- All 160 official recordings were validated and converted locally, but their approximately 900MB files are NOT included in this SOURCE-ONLY transfer. Local GitHub upload was too slow (60MB in about 8 minutes). Regenerate optimized audio in the CLOUD from the official source URLs already in catalog/audio source ledger. All completed texts and actual-time subtitles ARE included; do not redo recognition.
- All 160 full canonical texts and synchronized subtitle candidates are in source/public/subtitles/v4/. Catalog is source/public/library/catalog.json.
- Full pre-migration strict gate passed all160Passed=true. Estimated site bytes 908559072. Audio length/hash/full decode and waveform checks completed. Source text preservation and cue ranges checked. This does not mean full manual proofreading or listening to all recordings.
- 24 progress, migration, validation and preview-isolation checks passed before migration. Final full-data build and deployed-site verification remain.
- docs/index.html and docs/release.json still represent OLD v0.3.1. DO NOT publish this branch as-is.

## Required remaining work
1. Read repository instructions. Install source dependencies, run `node source/scripts/verify-progress.cjs`, run source build, inspect all160 v4 caption deployment and audio.
2. Verify mobile lyrics click-to-seek, original reading, unusual glyphs and missing-audio annotations, source switching, progress restoration and network retry. Physical Android/WeChat/Bluetooth have not been tested.
3. Merge source/dist into docs PRESERVING legacy assets, audio and subtitles. Update release metadata/version and accurate delivery README. Keep site below Pages limit.
4. Commit and publish to original main/GitHub Pages; verify actual deployment and public caption/audio availability. User already authorized this personal site update. Return original URL only after verification.

## Compatibility requirements
Keep localStorage `elvin-reading-library-v2`, schema2, stable chapter IDs. Do not delete old audio, old subtitle files or old hashed assets, which may be in use by active listeners. New captions use subtitles/v4/. Public QA uses `?preview=1` to avoid reading/writing real listening progress. Normal final URL is https://elvinnnnnwu.github.io/elvin-reading-room/ with no query. Do not add login/backend or hourly automation.

## Content differences retained explicitly
- v2-034: original sentence 以便使我们陷于孤立。 absent from current official recording.
- v2-009: original sentence 这是常识中包含的真理。 absent from current official recording.
Both retained with audioUnavailable and no fabricated seek time.
- v1-002: two unspoken parenthetical explanations retained with audioNote.
- v3-026 heading 全党团结起来为实现党的任务而斗争 verified against actual narration and official TOC.
- Two uncommon printed glyphs are rendered using the official book-page glyph image.
- Selected electronic edition wording and comparison-transcript differences are disclosed in per-chapter verification. Do not silently change to remembered wording.

## Sources and boundaries
Official narration: https://www.12371.cn/special/mzdxj/dyj/ and corresponding volume 2-4 pages. Primary texts: official TheoryChina electronic books, visually checked anomalies and central official reader comparison. Preserve source attribution and original rights. Four volumes /160 recording tracks is not all Mao works or volume5.
No raw recognition caches, downloaded models, private notes or credentials are included in this transfer.

## Source-only transfer: cloud audio preparation required
The authoritative transfer branch is `codex/cloud-handoff-v0.4-source`. The first large-media upload was deliberately canceled; do NOT wait for codex/cloud-handoff-v0.4. Local complete candidate remains committed separately for recovery.

For each catalog chapter download its exact official audioUrl (validate full download length and source SHA256 against source/public/audio/mobile-audio-source.json). Convert in cloud with:
`ffmpeg -v error -y -i ORIGINAL -map 0:a:0 -vn -ac 1 -ar 24000 -c:a aac -b:a 32k -movflags +faststart docs/audio/mobile/CHAPTER-mobile-v1.m4a`

Verify duration by full decoded PCM count on original (ffmpeg f s16le ar16000 ac1, bytes/32000), not only MP3 container duration, as some originals have incorrect metadata. Output duration must differ by less than0.16sec; compare four waveform samples at min(22,duration/8),25percent,60percent,and duration-8sec, allowing10ms phase. Existing subtitle timing is tied to unedited original narration; no cut/speed change is allowed. Different ffmpeg versions may produce different AAC SHA despite equivalent audio. If so, record new validated media hashes/bytes in ledger and matching subtitle verification fields; retain original source SHA and canonical text hashes. Do not mislabel an old local media SHA as the new cloud file SHA.

cloud-handoff-audit.json includes 160 original local results for comparison. Do not require byte-identical new AAC solely due to encoder version; require original source hash and actual audio-content/duration validation. Use bounded concurrency and retry; no periodic automation.
