import { Routes,RouterModule } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import {NgModule} from '@angular/core';
import { ServiceComponent } from './components/service/service.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { ContactComponent } from './components/contact/contact.component';

export const routes: Routes = [
    {
        path:"",
        component:LandingPageComponent,
        title:"SubtAi - Home"
    },
    {
        path:"service",
        component:ServiceComponent,
        title:"SubtAi - Service"
    },
    {
        path:"contact",
        component:ContactComponent,
        title:"SubtAi - Contact"
    },
    {
        path:"pricing",
        component:PricingComponent,
        title:"SubtAi - Pricing"
    }
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRouter{

}