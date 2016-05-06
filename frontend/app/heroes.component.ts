import { Component } from '@angular/core';
import { Hero } from './models/hero';
import { HeroDetailComponent } from './hero-detail.component';
import { HeroService } from './hero.service';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router-deprecated';

@Component({
  selector: 'my-heroes',
  templateUrl: 'frontend/app/heroes.component.html',
  styleUrls: ['frontend/app/heroes.component.css'],
  directives: [HeroDetailComponent],
  // providers: [HeroService]
})

export class HeroesComponent implements OnInit {
	heroes: Hero[];
	selectedHero: Hero;
	constructor(
		private router: Router,
		private heroService: HeroService) { }
	getHeroes() {
		this.heroService.getHeroes().then(heroes => this.heroes = heroes);
	}
	ngOnInit() {
		this.getHeroes();
	}
	onSelect(hero: Hero) { this.selectedHero = hero; }
	gotoDetail() {
		this.router.navigate(['HeroDetail', { id: this.selectedHero.id }]);
	}
}


