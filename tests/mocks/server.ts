import { setupServer } from 'msw/node';

export const server = setupServer();
export const unexpectedRequests: string[] = [];

export function rejectUnexpectedRequest(request: Request): never {
  const description = `${request.method} ${request.url}`;
  unexpectedRequests.push(description);
  // Throw before MSW can bypass to the network. The setup hook also fails the
  // test if application code catches the resulting request error/response.
  throw new Error(`Unexpected request blocked: ${description}`);
}
