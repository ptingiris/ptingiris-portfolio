import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component, ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ResizeEvent } from 'angular-resizable-element';
import { MediaMatcher } from '@angular/cdk/layout';
import { NavItem } from '../../models/general';
import { PersistentSettingsService } from '../../services/persistent-settings.service';
import { AuthenticationService } from '../../services/authentication.service';
import { MatList } from '@angular/material/list';

@Component({
  selector: 'lib-usic-sidebar',
  templateUrl: './usic-sidebar.component.html',
  styleUrls: ['./usic-sidebar.component.scss']
})
export class UsicSidebarComponent implements OnInit, AfterViewInit, AfterContentInit {

  @ViewChild('sidebar', { static: true }) sidebar: ElementRef;
  @ContentChild(MatList, { read: ElementRef, static: false } ) matList: ElementRef;

  @Input() position: string; // end
  @Input() activeItem: string;
  @Input() chevronRightIcon = 'chevron_right';
  @Input() chevronLeftIcon = 'chevron_left';
  @Input() helpText = 'Show/Hide';

  // sidebar v1 - use with tab navigation (ie, Asset Manager Edit Asset)
  @Input() nav: { title: string; desc: string; tab: string }[];

  // sidebar v2 - use with routed sidebar navigation (default)
  currentNavSubject = new BehaviorSubject<NavItem>(null);
  currentNav = this.currentNavSubject.asObservable();
  @Input() navItems: NavItem[];

  resizeEdges: any;

  /**
   a sidebar name is needed when there multiple sidebars
   so persistent settings can be saved for each sidebar
   **/
  @Input() sidebarName = 'sidebar';

  @Output() navChange = new EventEmitter<string>();

  mouseOver: boolean;
  hasIcons: boolean;
  @Input() ignoreIcons: boolean;

  @Input() defaultWidth = '320px';
  @Input() closed = false;
  icons = false;
  iconsWidth = '64px';
  showHideTrigger = true;

  protected sidebarWidthSubject = new BehaviorSubject<string>(null);
  sidebarWidth = this.sidebarWidthSubject.asObservable();

  mobileQuery: MediaQueryList;
  private mobileQueryListener: () => void;
  isMobile = false;

  constructor(
    protected persistentSettings: PersistentSettingsService,
    private authentication: AuthenticationService,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
  ) {
    // Determine if columns should be hidden due to mobile viewer
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this.isMobile = this.mobileQuery.matches;
    this.mobileQueryListener = () => {
      changeDetectorRef.detectChanges();
      this.isMobile = this.mobileQuery.matches;
    };
    this.mobileQuery.addEventListener('change', this.mobileQueryListener);


  }

  ngOnInit(): void {

    if (this.navItems) {

      console.log( 'navItems', this.navItems );
      this.currentNavSubject.next(this.navItems[0]);

      // Hide navItems for which the current user doesn't have a required role
      this.authentication.currentUser.subscribe(() => {
        const userRoles = this.authentication.currentUserRoles;
        this.navItems.forEach(navItem => {
          if (navItem.requiredRole || navItem.requiredRoles?.length) {
            navItem.show = navItem.show &&
              (navItem.requiredRole ?
                userRoles.includes(navItem.requiredRole) :
                userRoles.some(r => navItem.requiredRoles.includes(r)));
          }
        });
      });

    }
    else if( this.nav ) { // tab navigation (ie, Asset Manager Edit Asset)
      // hide the .show-hide-trigger element
      this.showHideTrigger = false;
    }

    // sets the closed flag to true if on a mobile device or the sidebar has been set to closed
    if (this.isMobile) { this.closed = true; }
    else {
      const state = this.persistentSettings.getSetting(this.sidebarName + '-state');
      this.closed = state === 'closed';
    }

    this.sidebarWidthSubject.next(
      this.persistentSettings.getSetting(this.sidebarName + '-width') ||
      this.defaultWidth
    );

    this.sidebarWidth.subscribe(width => {
      this.persistentSettings.setSetting(this.sidebarName + '-width', width);
    });

    this.resizeEdges = {

      top: false,
      right: this.position !== 'end',
      bottom: false,
      left: this.position === 'end'

    };
  }

  ngAfterViewInit(): void {

    this.hasIcons = this.sidebar.nativeElement.querySelectorAll('.mat-icon').length > 0;
    if (this.hasIcons) { this.sidebar.nativeElement.querySelector('.mat-list')?.classList.add('has-icons'); }

    const state = this.persistentSettings.getSetting(this.sidebarName + '-state');
    let width = this.persistentSettings.getSetting(this.sidebarName + '-width');
    switch (state) {
      case 'closed': width = this.ignoreIcons ? '8px' : this.iconsWidth; break;
      default: break;
    }
    this.sidebar.nativeElement.style.width = width;
  }

  ngAfterContentInit() {

    // if there is a MatList in the ng-content, make sure to add the .has-icons class
    this.matList?.nativeElement.classList.add('has-icons');

  }

  onResize(event: ResizeEvent): void {

    this.sidebarWidthSubject.next(event.rectangle.width + 'px');

  }

  navClick(item: string) {
    return this.navChange.emit(item);
  }

  resetSidebar() {
    this.sidebarWidthSubject.next(this.defaultWidth);
    this.persistentSettings.clearSetting(this.sidebarName + '-state');
  }

  closeSidebar() {

    this.hasIcons = this.sidebar.nativeElement.querySelectorAll('.mat-icon').length > 0;

    if (!this.hasIcons || this.ignoreIcons) {

      this.closed = !this.closed;
      const state = this.closed ? 'closed' : 'open';
      this.persistentSettings.setSetting(this.sidebarName + '-state', state);

    } else {

      switch (this.persistentSettings.getSetting(this.sidebarName + '-state')) {

        case 'closed': {
          this.sidebar.nativeElement.style.width = this.persistentSettings.getSetting(this.sidebarName + '-width');
          this.sidebar.nativeElement.classList.remove('closed');
          this.persistentSettings.setSetting(this.sidebarName + '-state', 'open');
          this.closed = false;
          break;
        }
        default: { // open
          this.sidebar.nativeElement.style.width = this.iconsWidth;
          this.sidebar.nativeElement.classList.add('closed');
          this.persistentSettings.setSetting(this.sidebarName + '-state', 'closed');
          this.closed = true;
        }

      }

    }

  }

  showSidebar() {

    this.closed = false;
    this.persistentSettings.setSetting(this.sidebarName + '-state', 'open');
    this.sidebar.nativeElement.style.width = this.persistentSettings.getSetting(this.sidebarName + '-width') || this.defaultWidth;

  }

  navItemClick(navItem) {

    this.currentNavSubject.next(navItem);

  }

}
