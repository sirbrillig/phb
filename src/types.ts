export type FileReadPromise = Promise<string | null>;

export type FileReadArrayPromise = Promise<Array<string>>;

export type FileWritePromise = Promise<void>;

export interface FileInterface {
	readRevision: () => FileReadPromise;
	writeRevision: (data: string) => Promise<void>;
	readDiff: () => FileReadPromise;
	writeDiff: (data: string) => Promise<void>;
	readAllDiffs: (revisionId: string) => Promise<Array<string>>;
}

export interface ArcInterface {
	runArcCommand: (command: string) => Promise<string>;
	runArcConduitCommand: (
		command: string,
		data: object
	) => Promise<ArcConduitCommandResult>;
}

export interface ArcConduitCommandResult {
	error?: string;
	errorMessage?: string;
	response?: Array<ArcConduitResponse>;
}

export type ArcConduitResponseValue = never[] | string | number | boolean | ArcConduitResponseObject | Array<ArcConduitResponseValue>;

export type ArcConduitResponseObject = {
	[prop: string]: ArcConduitResponseValue;
};

export type ArcConduitResponse = {
	diffs?: Array<string>;
	id?: string;
	phid: string;
	title?: string;
	uri?: string;
	dateCreated?: string;
	dateModified?: string;
	authorPHID?: string;
	status?: string;
	statusName?: string;
	properties?: ArcConduitResponseObject;
	branch: string;
	summary: string;
	testPlan: string;
	lineCount: string;
	activeDiffPHID: string;
	repositoryPHID: string;
	sourcePath: string;
} & {
	[prop: string]: ArcConduitResponseValue;
};

export interface PHBInterface {
	getActiveRevision: () => FileReadPromise;
	setActiveRevision: (revision: string) => Promise<void>;
	getActiveDiff: () => FileReadPromise;
	setActiveDiff: (diff: string) => Promise<void>;
	createNewRevision: () => Promise<void>;
}
