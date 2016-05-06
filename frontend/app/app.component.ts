import { Component }       from '@angular/core';
import { HeroService }     from './hero.service';
import { DashboardComponent } from './dashboard.component';
import { HeroesComponent } from './heroes.component';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { HeroDetailComponent } from './hero-detail.component';

@Component({
	selector: 'my-app',
	templateUrl: 'frontend/html/app.component.html',
    styleUrls: ['frontend/css/app.component.css'],
    directives: [ROUTER_DIRECTIVES],
	providers: [HeroService, ROUTER_PROVIDERS]
})

@RouteConfig([
	{
		path: '/heroes',
		name: 'Heroes',
		component: HeroesComponent
	},
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: DashboardComponent,
		useAsDefault: true
	},
	{
		path: '/detail/:id',
		name: 'HeroDetail',
		component: HeroDetailComponent
	}
])

export class AppComponent {
	title = 'Tour of Heroes';
}

