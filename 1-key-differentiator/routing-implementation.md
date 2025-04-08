# Routing Implementation
## Advanced Routing Patterns for Enterprise Angular Applications

This document outlines the sophisticated routing architecture implemented in the Underground Utility Location and Damage Prevention Application Framework. The routing system combines multiple advanced Angular patterns to provide optimized performance, granular access control, and a seamless user experience.

## Routing Architecture Overview

The application's routing architecture follows a hierarchical, feature-based organization:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Root Routing                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ Auth Routes │  │ Core Routes │  │ Feature     │  │ Error  │  │
│  │             │  │             │  │ Routes      │  │ Routes │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Feature Module Routing                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ Tickets     │  │ Map         │  │ Utilities   │  │ Admin  │  │
│  │ Module      │  │ Module      │  │ Module      │  │ Module │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Component Routing                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ List View   │  │ Detail View │  │ Create/Edit │  │ Special│  │
│  │ Routes      │  │ Routes      │  │ Routes      │  │ Views  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Routing Features

### 1. Feature-Based Lazy Loading

All feature modules are lazily loaded to minimize the initial application bundle size:

```typescript
const routes: Routes = [
  {
    path: 'tickets',
    loadChildren: () => import('./modules/tickets/tickets.module').then(m => m.TicketsModule),
    canActivate: [AuthGuard],
    data: {
      rolePreload: ['excavator', 'locator', 'reviewer', 'admin'],
      preloadPriority: 'high'
    }
  },
  {
    path: 'map',
    loadChildren: () => import('./modules/map/map.module').then(m => m.MapModule),
    canActivate: [AuthGuard, DeviceCapabilityGuard],
    data: {
      requiredCapabilities: ['geolocation', 'webgl'],
      rolePreload: ['excavator', 'locator', 'reviewer'],
      preloadPriority: 'high'
    }
  }
  // Additional routes...
];
```

### 2. Custom Preloading Strategy

A sophisticated preloading strategy prioritizes modules based on user roles, preferences, and feature flags:

```typescript
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
    private featureFlagService: FeatureFlagService
  ) {}
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Skip preloading if explicitly marked for lazy loading
    if (route.data && route.data.noPreload) {
      return of(null);
    }
    
    // Preload modules based on user role
    if (route.data && route.data.rolePreload) {
      return this.userService.currentUser$.pipe(
        take(1),
        switchMap(user => {
          const rolesToPreload = route.data.rolePreload as string[];
          
          if (user && user.roles.some(role => rolesToPreload.includes(role))) {
            return of(true).pipe(
              delay(100),
              switchMap(() => load())
            );
          }
          
          return of(null);
        })
      );
    }
    
    // Additional preloading logic...
    
    // Default to preloading everything not explicitly excluded
    return load();
  }
}
```

### 3. Route Guards for Access Control

Multiple route guards provide granular control over route access:

```typescript
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private notificationService: NotificationService
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredPermissions = route.data?.permissions as string[] || [];
    
    if (!requiredPermissions.length) {
      return of(true);
    }
    
    return this.permissionService.hasPermissions(requiredPermissions).pipe(
      tap(hasPermission => {
        if (!hasPermission) {
          this.notificationService.error('Access Denied', 'You do not have permission to access this area');
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }
}
```

Additional guards include:
- `AuthGuard`: Ensures users are authenticated
- `DeviceCapabilityGuard`: Prevents navigation to routes requiring capabilities not supported by the device
- `UnsavedChangesGuard`: Prevents leaving routes with unsaved changes

### 4. Route Resolvers for Data Prefetching

Resolvers ensure data is available before route activation:

```typescript
@Injectable({
  providedIn: 'root'
})
export class TicketResolver implements Resolve<Ticket> {
  constructor(
    private ticketService: TicketService,
    private router: Router
  ) {}
  
  resolve(route: ActivatedRouteSnapshot): Observable<Ticket> {
    const ticketId = route.paramMap.get('id');
    
    if (!ticketId) {
      this.router.navigate(['/tickets']);
      return EMPTY;
    }
    
    return this.ticketService.getTicket(ticketId).pipe(
      catchError(error => {
        this.router.navigate(['/tickets']);
        return EMPTY;
      })
    );
  }
}
```

### 5. Custom Route Reuse Strategy

A custom route reuse strategy optimizes performance by maintaining component state:

```typescript
@Injectable()
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  
  // Determine if route should be detached for later reuse
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Only detach routes marked for reuse
    return route.data?.reuseRoute === true;
  }
  
  // Store the detached route
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.data?.reuseRoute) {
      const routeKey = this.getRouteKey(route);
      this.storedRoutes.set(routeKey, handle);
    }
  }
  
  // Determine if a route should be reattached
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const routeKey = this.getRouteKey(route);
    return route.data?.reuseRoute === true && this.storedRoutes.has(routeKey);
  }
  
  // Retrieve the stored route
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const routeKey = this.getRouteKey(route);
    return this.storedRoutes.get(routeKey) || null;
  }
  
  // Helper methods...
}
```

### 6. Dynamic Breadcrumb Generation

A breadcrumb service automatically generates contextual navigation:

```typescript
@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);
  
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.buildBreadcrumbs(this.activatedRoute.root))
    ).subscribe(breadcrumbs => {
      this.breadcrumbs$.next(breadcrumbs);
    });
  }
  
  get breadcrumbs(): Observable<Breadcrumb[]> {
    return this.breadcrumbs$.asObservable();
  }
  
  private buildBreadcrumbs(
    route: ActivatedRoute, 
    url: string = '', 
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    // Breadcrumb generation logic...
  }
  
  private getLabel(route: ActivatedRouteSnapshot): string | null {
    // Handle both string and function breadcrumbs
    const breadcrumb = route.data.breadcrumb;
    
    if (!breadcrumb) {
      return null;
    }
    
    if (typeof breadcrumb === 'function') {
      return breadcrumb(route.data);
    }
    
    return breadcrumb;
  }
}
```

## Example Feature Module Routing

The Tickets module demonstrates the feature-based routing implementation:

```typescript
const ticketsRoutes: Routes = [
  {
    path: '',
    component: TicketsLayoutComponent,
    data: {
      breadcrumb: 'Tickets'
    },
    children: [
      {
        path: '',
        component: TicketListComponent,
        data: {
          title: 'Ticket Dashboard',
          reuseRoute: true,
          breadcrumb: null
        }
      },
      {
        path: 'create',
        component: CreateTicketComponent,
        canActivate: [PermissionGuard],
        canDeactivate: [UnsavedChangesGuard],
        data: {
          title: 'Create New Ticket',
          permissions: ['create_ticket'],
          breadcrumb: 'Create New'
        }
      },
      {
        path: ':id',
        component: TicketDetailsContainer,
        resolve: {
          ticket: TicketResolver
        },
        data: {
          breadcrumb: (data: any) => `Ticket #${data.ticket.number}`
        },
        children: [
          // Nested routes for ticket details views...
        ]
      }
    ]
  }
];
```

## Routing Performance Optimizations

Several optimizations were implemented to enhance routing performance:

1. **Selective Preloading**: Critical modules are preloaded based on user role and behavior patterns
2. **Route Reuse**: Complex views are preserved when navigating away and back
3. **Data Prefetching**: Resolvers load necessary data before activating routes
4. **Bundle Size Optimization**: Feature modules are split by functionality
5. **Loading Indicators**: Intelligent loading indicators show only for longer operations

## Route Data Enrichment

Routes are enriched with metadata to enhance the routing experience:

```typescript
{
  path: 'tickets',
  loadChildren: () => import('./modules/tickets/tickets.module').then(m => m.TicketsModule),
  data: {
    title: 'Tickets',              // For document title
    breadcrumb: 'Tickets',         // For breadcrumb generation
    icon: 'ticket',                // For navigation UI
    permissions: ['view_tickets'], // For access control
    reuseRoute: true,              // For route reuse strategy
    preloadPriority: 'high',       // For preloading strategy
    animation: 'fade',             // For route transitions
    analyticsTrack: true           // For usage analytics
  }
}
```

## Route Animations

Smooth transitions between routes enhance the user experience:

```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          })
        ], { optional: true }),
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], { optional: true }),
          query(':enter', [animate('300ms ease-out', style({ opacity: 1 }))], { optional: true })
        ]),
        query(':enter', animateChild(), { optional: true })
      ])
    ])
  ]
})
export class AppComponent {
  // Get animation data from route
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation;
  }
}
```

## Conclusion

The routing implementation for the Underground Utility Location and Damage Prevention Application Framework demonstrates advanced Angular routing patterns that enhance performance, maintainability, and user experience. By combining lazy loading, custom preloading strategies, granular access control, and intelligent data prefetching, the application delivers an optimized navigation experience while maintaining a manageable codebase.

These routing patterns have proven effective in a complex enterprise application and can be adapted for use in other Angular projects requiring sophisticated navigation and state management.
