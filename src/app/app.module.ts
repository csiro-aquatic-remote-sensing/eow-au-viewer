import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {Brolog} from 'brolog';
import {brologLevel} from './globals';

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
      // 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'silly'
      useFactory: function brologFactory() { return Brolog.instance(brologLevel); }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
