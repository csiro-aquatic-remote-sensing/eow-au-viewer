import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

interface LoginProfile {
  token: string;
  user_id: number;
  fullName: string;
  nickname: string;
  email: string;
  user_points: number;
  user_level: number;
  user_photos: number;
  display_identity: string
}

export interface LoginResponse {
  status: string;
  message: string;
  profile: LoginProfile;
}

const URL = 'https://www.eyeonwater.org/api/login';

@Injectable()
export class LoginService {
  private _loginResponse: LoginResponse;
  private _loginResponseObs: BehaviorSubject<LoginResponse> = new BehaviorSubject(null);

  getLoginURL() {
    return URL;
  }

  public set loginResponse(loginResponse: LoginResponse) {
    this._loginResponse = loginResponse;
    this._loginResponseObs.next(this._loginResponse);
  }

  public get loginResponse(): LoginResponse {
    return this._loginResponse;
  }

  /**
   * To be notified of changes.
   */
  public get loginResponseObs() {
    return this._loginResponseObs.asObservable();
  }
}
