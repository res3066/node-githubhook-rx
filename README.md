# node-githubhook-rx

Node-github-hook-rx is a minimal receiver for github notification hooks with no dependencies.  It is expected to run as a non-root user, started by SMF, systemd, or something of that nature.

Node-github-hook-tx is a minimal transmitter for sending Github-compatible "push" notifications (e.g. from gitolite or somewhere else that you want to trigger such things from).

Github lets you select application/x-www-form-urlencoded or application/json.  Only the latter is supported.  application/x-www-form-urlencoded is for suckas.

All the minimalist node.js github hook receivers I could find online
suffered from the same problem - they'd crash after receiving three or
so notifications.  Today (2019-10) Github sends about 8k worth of JSON as
part of the PUT payload, and it is not guaranteed to be delivered in a single
chunk - failure to drain the queue will result in badness down the line (as
well as failed sha1 checksum of the payload.

Being a little stubborn and not wanting to rely upon constant resucitation by systemd
or smf, I wrote my own.  It seems to work and not crash.  Tested under node v10.5.0.

The transmitter doesn't send anything approaching the size of Github's push hook notification big-ol-blob-o-JSON, but it does post something small enough that if someone on the far end is trying to run a JSON parser over it they at least won't bomb out with a parser error (though they likely won't find the variable they were looking for).  It does, however, set the operative headers and sends a POST and the whole affair is sha1 hashed with a shared secret just like Github.

There is basic replay attack protection - we crawl the json and enforce timestamp slop that defaults to 5 minutes (300000 ms).  Forcing a git pull and static site rebuild with Hugo or Jekyll is fairly low risk (though we do take the elementary precaution of only allowing updates from the sources listed at https://api.github.com/meta even though Github advises against it for some unknown reason).

Suggested improvements:

- Receiver should crawl the posted JSON, enforce timestamp constraints from .updated_at or .repository.pushed_at to minimize window for replay attacks.

- https pointing to the same certs that nginx, apache, etc. uses

- Potentially some other stuff should be runtime options with sensible defaults.

