#!/usr/bin/env node
import { Command } from 'commander';
import { reviewCommand } from './commands/review';

// Create the CLI program
const program = new Command();

program
  .name('prreviewbot')
  .description('AI-powered PR reviewer that checks code style, bugs, and security issues')
  .version('1.0.0');

// Add commands
program.addCommand(reviewCommand());

// Parse command line arguments
program.parse(process.argv); 