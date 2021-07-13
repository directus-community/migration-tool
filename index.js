import Listr from "listr";

import commandLineArgs from "command-line-args";
import * as fs from 'fs';
import { migrateSchema } from "./tasks/schema.js";
import { migrateFiles } from "./tasks/files.js";
import { migrateUsers } from "./tasks/users.js";
import { migrateData } from "./tasks/data.js";

const commandLineOptions = commandLineArgs([
	{
		name: "skipCollections",
		alias: "s",
		type: String,
		multiple: true,
		defaultValue: [],
	},
	{
		name: "useContext",
		alias: "c",
		type: String,
		multiple: false,
		defaultValue: './context/start.json'
	},
]);

const tasks = new Listr([
  {
    title: "Loading context",
    task: setupContext,
  },
  {
    title: "Migrating Schema",
		skip: context => context.completedSteps.schema === true,
    task: (context) => {
      context.skipCollections = commandLineOptions.skipCollections;
      return migrateSchema(context);
    },
  },
  {
    title: "Migration Files",
		skip: context => context.completedSteps.files === true,
    task: migrateFiles,
  },
  {
    title: "Migrating Users",
		skip: context => context.completedSteps.users === true,
    task: migrateUsers,
  },
  {
    title: "Migrating Data",
		skip: context => context.completedSteps.data === true,
    task: migrateData,
  },
]);

export async function writeContext(context, section) {
  context.completedSteps[section] = true;
	await fs.promises.writeFile(`./context/${section}.json`, JSON.stringify(context));
}

async function setupContext(context) {
	const contextJSON = await fs.promises.readFile(
    commandLineOptions.useContext,
    'utf8'
  );
  console.log('Loading context', contextJSON);
  const fetchedContext = JSON.parse(contextJSON);
  Object.entries(fetchedContext).forEach(([key, value]) => {
    context[key] = value;
  });
	console.log(
		`✨ Loaded context succesfully`
	)
}

console.log(
	`✨ Migrating ${process.env.V8_URL} (v8) to ${process.env.V9_URL} (v9)...`
);

tasks
	.run()
	.then(() => {
		console.log("✨ All set! Migration successful.");
	})
	.catch((err) => {
		console.error(err);
	});
