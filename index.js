const localRepo = __dirname + '/../spy2mpama';
const simpleGit = require("simple-git");
const git = simpleGit();
var fs = require('fs')
const gitFilePath = __dirname + "/../spy2mpama/www/gitNotes.txt";
const remoteRepo = 'https://github.com/mphoza223/Spy2Mpama.git';

const messages = require("./msg.js").msg_arr;
const runs = Math.floor(Math.random() * 4) + 1; //decide how many commits we're making

function getMessage(){
	let rnd = Math.floor(Math.random() * (messages.length));
	return messages[rnd];
}



// console.log(gitFilePath)


fs.readFile(gitFilePath, 'utf8', function(err, data){
var newValue = data.replace('', '\n');
	
	fs.writeFile(gitFilePath, newValue, async function(){

		try{

				// await git.checkout("main");
				const branch = await git.branch('-M', 'main');

				// // logs "test-branch"
				// console.log(branch.current)

			     await git.pull(localRepo,'main')
			     await git.add('.')
			     await git.commit(getMessage())
			     await git.addRemote('origin', remoteRepo)
			     await git.push(['-u', 'origin', branch.current], () => console.log('push successful'));

			}catch(error){
			console.log(error)
		}
		
	});
});


