import { Profile as XProfile } from '@superfaceai/passport-twitter-oauth2';

export interface ExtendedXProfile extends XProfile {
    photos?: {
        value: string;
    }[];
    xAccessToken: string;
    xRefreshToken: string;
    xExpiryDate: number;
}