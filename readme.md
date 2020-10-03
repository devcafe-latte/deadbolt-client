# Deadbolt Client

Client for the [deadbolt](https://github.com/devcafe-latte/deadbolt/) user service.

## Usage example

```ts
import { DeadboltClient } from 'deadbolt-client';
import { DeadboltUser, NewUserData } from './Users/User';

const client = new DeadboltClient({ endpoint: 'http://deadbolt:3000' });

const data: NewUserData = {
  email: 'test@example.com',
  username: 'testo',
  password: 'shinyshoesfor5sheckles',
};

//Add a user
client.addUser(data).then(user => {
  console.log("User created!", user.uuid);
});

//Login
// Note that Identifier can be uuid, email or username.
const identifier = 'test@example.com';
const password = 'shinyshoesfor5sheckles';
client.login({ identifier, password }).then(result => {
  console.log("Login ok?: ", result.success);
  console.log("User object", result.user);
  console.log("Session token", result.user.session.token);
});
```

## Todo

[ ] Most of the documentation
[ ] Setup automated testing
[ ] Publish on npm
[ ] Link to specific version of Deadbolt (currentl 2.1.0)
[ ] Redo deadbolt :see-no-evil: