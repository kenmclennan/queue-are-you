export interface QueueConfig {
    readonly name: string;
    readonly key: string;
    readonly options?: object;
    readonly handler?: QueueTask;
}

export interface ExchangeConfig {
    readonly url: string;
    readonly name: string;
    readonly type: string;
    readonly options?: object;
}

export interface ConsumerConfig {
    readonly exchange: ExchangeConfig;
    readonly queues: QueueConfig[];
}

export interface MessageData {
    readonly label: string;
    readonly sent_at: string;
    readonly message_id: string;
    readonly data: {
        [propName: string]: any,
    };
}

export interface QueueTask {
    (data: MessageData): Promise<void>;
}
