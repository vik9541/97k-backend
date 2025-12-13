import { Test, TestingModule } from '@nestjs/testing';
import { GdprController } from './gdpr.controller';

describe('GdprController', () => {
  let controller: GdprController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GdprController],
    }).compile();

    controller = module.get<GdprController>(GdprController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
