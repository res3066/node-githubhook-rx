#!/opt/local/bin/node

// this daemon does not chdir.  set proper directory out of smf or systemd or whatever
// github advises against firewalling incoming api but we know better.
// https://api.github.com/meta json object contains a hooks: [] array; bolt down
// your firewall to just that as the spirit moves you.

// things imported from the environment with decent defaults (or explicitly bad one
// for the secret

// takes a single argv - the full path of the script to run upon successful authentication.


const secret = process.env.SECRET ? process.env.SECRET : 'badsecret';
const port = process.env.PORT ? process.env.PORT : 8080;

// milliseconds in replay-allowed window
// 300000 ms is five minutes.
const timeslopms = process.env.TIMESLOP ? process.env.TIMESLOP : 300000;

// COMMANDS array in the env turned out to be escaping/quoting hell.
// Just passing a script to run now.  Pbbbt.

// COMMANDS environment variable is a json array of commands things to run.
// All normal environment variables are passed through so stuff like
// GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no" git clone user@host
// and
// GIT_SSH (beware)
// will be passed in, BUT in the particular case of ssh you are probably better off using
// ~updateuser/.ssh/config
//const commands = process.env.COMMANDS ? JSON.parse(process.env.COMMANDS) :
//      ['git fetch origin master',
//       'git reset --hard origin/master',
//      'git pull origin master --force',
//        [ '/home/rs/run-githooks.sh' ];
       // your build commands here 
//       'true'];

/////////////////

const http = require('http');
const crypto = require('crypto');
const execSync = require('child_process').execSync;

var server = http.createServer(function (req, res) {
    const { headers, method, url } = req;
    let bod = [];

    req.on('error', (err) => {
	console.error(err);
    }).on('data', (chunk) => {
	// github sends us about 8k worth of json which ends up being 3-6 chunks worst case
	// more than 50 chunks is surely shenanigans.  note that the hash will fail,
	// but don't let someone send us a terabyte of nonsense and dos us
	if (bod.length < 50) {
	    bod.push(chunk);
	}
    }).on('end', () => {
	bod = Buffer.concat(bod).toString();

	let sig = "sha1=" + crypto.createHmac('sha1', secret).update(bod).digest('hex');

	var remoteaddr = req.socket.remoteAddress.substr(0,7) == "::ffff:" ? req.socket.remoteAddress.substr(7) : req.socket.remoteAddress ;

        if (((req.headers['x-github-event'] == 'push') || (req.headers['x-github-event'] == 'ping')) &&
	    (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(req.headers['x-hub-signature'])))) {

	    try {
		var posted = new Date(JSON.parse(bod).repository.pushed_at * 1000);
	    } catch (e) {}
	    
	    let now = new Date();

	    if (timeslopms > Math.abs(now - posted)) {

		res.writeHead(200, {
		    "Content-Type": "text/plain",
		    "Server": "ClueTrust-GithubHook-rx-0.1a",
		    "Cache-Control": "no-cache" });

		res.write('Hello Github!');

		// this stalls the event loop while spawned processes complete.
		// we are good with this.
		// should only take a couple of seconds for a git update
//		for (const cmd of commands) {
//		    let now = new Date();
//		    let ts = now.toISOString();
//		    console.log('Executing \"' + cmd + '\" at ' + ts);
//		    let cmdout = execSync(cmd).toString();
//		    console.log(cmdout);
//		}

// instead of iterating over a list, just run the script (full path in argv[2])
                let ts = now.toISOString();
                console.log('Executing \"' + process.argv[2] + '\" at ' + ts);
                let cmdout = execSync(process.argv[2]).toString();
                console.log(cmdout);


		now = new Date();
		ts = now.toISOString();

		console.log('finished processing hook by request of ' + remoteaddr + ' at ' + ts);
	    } else { // time out of spec, suspect ntp issues or shenanigans
		res.writeHead(403, {
		    "Content-Type": "text/plain",
		    "Server": "ClueTrust-GithubHook-rx-0.1a",
		    "Cache-Control": "no-cache" });
		res.write('timestamp out of window');
		let now = new Date();
		let ts = now.toISOString();
		console.log('timestamp out of window from ' +  remoteaddr + ' at ' + ts);
	    }
	} else { // signature incorrect

	    res.writeHead(403, {
		"Content-Type": "text/plain",
		"Server": "ClueTrust-GithubHook-rx-0.1a",
		"Cache-Control": "no-cache" });
	    res.write('The answer is no.');
	    let now = new Date();
	    let ts = now.toISOString();
	    console.log('webhook signature incorrect from ' +  remoteaddr + ' at ' + ts);
	}

	res.end("\n");

    } ) } );

server.listen(port, "::");

console.log(process.argv[1] + " listening on port " + port + " v4 and v6");


