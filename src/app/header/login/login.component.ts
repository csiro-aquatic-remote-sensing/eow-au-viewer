import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-framework/jqwidgets-ng/jqxwindow';
import {jqxButtonComponent} from 'jqwidgets-framework/jqwidgets-ng/jqxbuttons';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {LoginResponse, LoginService} from './login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('windowReference', {static: false}) window: jqxWindowComponent;
  @ViewChild('jqxWidget', {static: false}) jqxWidget: ElementRef;
  @ViewChild('loginButton', {static: false}) loginButton: jqxButtonComponent;
  @ViewChild('inputUser', {static: false}) inputUser: ElementRef;
  @ViewChild('inputPassword', {static: false}) inputPassword: ElementRef;
  message = '';
  // loginReponse: LoginResponse;
  linkText = 'Login';

  constructor(private loginService: LoginService, private http: HttpClient) {
  }

  ngOnInit() {
  }

  onLoginLogoutOpen() {
    if (this.loginService.loginResponse) {
      this.loginService.loginResponse = null;
      this.linkText = 'Login';
    } else {
      this.window.open();
    }
  }

  onLogin(event) {
    console.log(`login - event: ${event}`);
    const email = this.inputUser.nativeElement ? this.inputUser.nativeElement.value : null;
    const password = this.inputPassword.nativeElement ? this.inputPassword.nativeElement.value : null;

    if (email && password) {
      const headers = new HttpHeaders({'Content-Type': 'application/json'});
      this.http.post<LoginResponse>(this.loginService.getLoginURL(), {email, password}, {headers})
        .pipe(
          catchError(this.handleError))
        .subscribe(response => {
          console.log(`response: ${response}`);
          if (response.status === 'failed') {
            this.message = 'Login failed';
          } else {
            console.log(`successfully logged in`);
            this.loginService.loginResponse = response;
            this.linkText = 'Logout';
            this.window.close();
          }
        });
    }
  }

  keyDown(event) {
    this.message = '';
  }

  keyUp(event) {
    this.loginButton.disabled(true);
    if (this.inputUser.nativeElement !== null && this.inputUser.nativeElement.value !== '') {
      if (this.inputPassword.nativeElement !== null && this.inputPassword.nativeElement.value !== '') {
        this.loginButton.disabled(false);
      }
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  }

  getHeaderText() {
    if (this.loginService.loginResponse) {
      return `Hello ${this.loginService.loginResponse.profile.nickname}`;
    }
    return '';
  }
}
