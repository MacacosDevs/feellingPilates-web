import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import { rejectUnexpectedRequest, server, unexpectedRequests } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: rejectUnexpectedRequest }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  server.resetHandlers();
  const requests = unexpectedRequests.splice(0);
  expect(requests, 'MSW blocked unexpected requests (including caught errors)').toEqual([]);
});

afterAll(() => server.close());
