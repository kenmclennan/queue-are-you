import messageHandler from '../messageHandler';

describe('messageHandler', () => {
    let callback;
    let channel;
    let handler;
    let message;

    beforeEach(() => {
        callback = jest.fn(async () => { });
        channel = {
            ack: jest.fn(),
            reject: jest.fn(),
        };
        message = {
            content: {
                toString: jest.fn(() => JSON.stringify({
                    label: 'this is the payload',
                })),
            },
        };
        handler = messageHandler(channel, callback);
    });

    it('creates a callable wrapper', () => {
        expect(handler).toBeInstanceOf(Function);
    });

    describe('when the wrapper is called', () => {
        describe('without a message', () => {
            it('does nothing', async () => {
                await handler(null);
                expect(callback).not.toHaveBeenCalled();
                expect(channel.ack).not.toHaveBeenCalled();
                expect(channel.reject).not.toHaveBeenCalled();
            });
        });

        describe('when called with a message', () => {
            beforeEach(async () => {
                await handler(message);
            });

            it('parses the contents of the message', () => {
                expect(message.content.toString).toHaveBeenCalled();
            });

            it('passes the content to the callback', () => {
                expect(callback).toHaveBeenCalledWith({
                    label: 'this is the payload',
                });
            });

            it('acknowledges the message', () => {
                expect(channel.ack).toHaveBeenCalledWith(message);
            });
        });

        describe('when the callback raises', () => {
            beforeEach(async () => {
                callback = jest.fn(async () => {
                    throw new Error('it failed');
                });
                handler = messageHandler(channel, callback);
                await handler(message);
            });

            it('does not acknowledge the message', () => {
                expect(channel.ack).not.toHaveBeenCalled();
            });

            it('rejects the message', () => {
                expect(channel.reject).toHaveBeenCalledWith(message, false);
            });
        });
    });
});
