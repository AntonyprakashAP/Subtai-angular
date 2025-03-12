import { Routes,RouterModule } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import {NgModule} from '@angular/core';

export const routes: Routes = [
    {
        path:"",
        component:LandingPageComponent,
        title:"SubtAi - Home"
    }
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRouter{

}