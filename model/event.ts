import { Match } from './match';

export class EventSchedule {
    Schedule: Match[];
}

export class EventType {
    eventCode: string;
    type: string;
}

export class EventAvatars {
    teams: TeamAvatar[];
    teamCountTotal: number;
    teamCountPage: number;
    pageCurrent: number;
    pageTotal: number;
}

export class TeamAvatar {
    teamNumber: number;
    encodedAvatar: string;
}
