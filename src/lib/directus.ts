import { createDirectus, rest, authentication, type AuthenticationStorage, type AuthenticationData } from '@directus/sdk';

class MemoryStorage implements AuthenticationStorage {
  private authData: AuthenticationData | null = null;

  // The SDK now expects get() with no arguments to return the whole auth object
  get(): AuthenticationData | null {
    return this.authData;
  }

  // set() takes the entire AuthenticationData object
  set(data: AuthenticationData | null): void {
    this.authData = data;
  }

  // delete() just clears the local variable
  delete(): void {
    this.authData = null;
  }
}

const directus = createDirectus(process.env.NEXT_PUBLIC_DIRECTUS_URL!)
  .with(rest())
  .with(authentication('json', {
    storage: new MemoryStorage()
  }));

export default directus;