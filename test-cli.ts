import { logger, parseCommandLineArguments, runCLI } from "./src";


const getParsedArgs = parseCommandLineArguments(['--tests-enabled=true', '--test-command=run-tests']);

console.log('Parsed Arguments:', getParsedArgs);