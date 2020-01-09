import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {Brolog} from 'brolog';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [
    {
      provide: Brolog,
      useFactory: function brologFactory() { return Brolog.instance('info'); }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
