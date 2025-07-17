# 1 Get application config

We need to have a big config that describes how this tool is going to operate.

It is going to be configured throug environment variables or arguments to the tool. Both should be supported. Arguments will be proritized over environment variables.

I need a config with following data:

- Package manager: yarn, npm or bun -> defaults to yarn
- Is e2e tests enabled -> defaults to true
- Command in package.json to run e2e tests -> defatuls to "test:e2e"
- is tests enabled -> defaults to true
- Command in package.json to run normal unit tests -> defaults to "test"

- Command in package.json to start dev server -> defaults to "dev"

- Banned scripts in package.json. A list of comma seperated scripts that is not allowed to run through this mcp

- Is TypeORM enabled
- Command in package.json to generate migration file -> defaults to "migration:generate"

# 2 Also support PHP, Composer, Lando
- In some of our other projects we use PHP and Composer as package manager, that should also be supported.
- This means that we should start the servers diffently. Fx. if Lando is enabled, we should use Lando instead of PM2


# 3 Support defining the command of the package manager
As the path or way to execute the package manager can be different for each environment, we need to able to override it.

# 4 Support other testing tools than Jest such as php unit