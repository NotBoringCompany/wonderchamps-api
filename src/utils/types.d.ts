import { Profile as TwitterProfile } from '@superfaceai/passport-twitter-oauth2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { ExtendedTwitterProfile } from './customProfiles';

declare global {
    namespace Express {
        export interface User extends ExtendedTwitterProfile {}
    }
}

export {} // needed to make this file a module