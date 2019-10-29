# node-githubhook-rx

A minimal receiver for github notification hooks with no dependencies.

All the minimalist node.js github hook receivers I could find online
suffered from the same problem - they'd crash after receiving three or
so notifications.  Today (2019-10) Github sends about 8k worth of JSON as
part of the PUT payload, and it is not guaranteed to be delivered in a single
chunk - failure to drain the queue will result in badness down the line (as
well as failed sha1 checksum of the payload.

Being a little stubborn and not wanting to rely upon constant resucitation by systemd
or smf, I wrote my own.  It seems to work and not crash.  Tested under node v10.5.0.

Suggested improvements:

- Crawl the posted JSON, enforce timestamp constraints from .updated_at or .repository.pushed_at to avoid replay attacks

- https


