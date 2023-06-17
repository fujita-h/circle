import { ConsoleLogger } from '@nestjs/common';

export class Logger extends ConsoleLogger {
  log(message: any, context?: string): void {
    // add your tailored logic here
    super.log(message, context);
  }

  error(message: any, stack?: string, context?: string): void {
    // add your tailored logic here
    super.error(message, stack, context);
  }

  warn(message: any, ...optionalParams: any[]): void {
    // add your tailored logic here
    super.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    // add your tailored logic here
    super.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    // add your tailored logic here
    super.verbose(message, ...optionalParams);
  }
}
