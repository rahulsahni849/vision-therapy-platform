import { Injectable } from '@nestjs/common';
import { ActivityModuleType } from '@vision/shared';

@Injectable()
export class ActivityRegistry {
  private activities = new Map<string, ActivityModuleType>();

  register(activity: ActivityModuleType) {
    this.activities.set(activity.manifest.key, activity);
  }

  getActivity(key: string): ActivityModuleType | undefined {
    return this.activities.get(key);
  }

  getAllActivities(): ActivityModuleType[] {
    return Array.from(this.activities.values());
  }

  getManifests() {
    return this.getAllActivities().map((a) => a.manifest);
  }

  scoreSession(activityKey: string, rawResult: unknown) {
    const activity = this.getActivity(activityKey);
    if (!activity) {
      throw new Error(`Activity with key "${activityKey}" not found`);
    }
    return activity.scoreSession(rawResult);
  }
}
