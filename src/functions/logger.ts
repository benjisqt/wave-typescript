import chalk from "chalk";

export default async function log(message: string, error: boolean) {
  if (error === false) {
    return console.log(
      `${chalk.bold(chalk.white(`wave`))}${chalk.bold(
        chalk.blue(`TS`)
      )} >> ${message}`
    );
  } else {
    return console.log(`${chalk.bold(chalk.white(`wave`))} >> ${message}`);
  }
}
