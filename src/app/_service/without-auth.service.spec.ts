import { TestBed } from '@angular/core/testing';

import { WithoutAuthService } from './without-auth.service';

describe('WithoutAuthService', () => {
  let service: WithoutAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WithoutAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
