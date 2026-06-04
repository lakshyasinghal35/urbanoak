jest.mock('../../../src/config/kafka', () => ({
  isKafkaEnabled: jest.fn(() => true),
  connectKafkaConsumer: jest.fn(),
  getKafkaConsumer: jest.fn(),
}));

const kafkaConfig = require('../../../src/config/kafka');
const messageConsumer = require('../../../src/common/events/messageConsumer');

describe('common/events/messageConsumer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kafkaConfig.isKafkaEnabled.mockReturnValue(true);
    kafkaConfig.connectKafkaConsumer.mockResolvedValue(true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('parseMessageValue returns null for invalid JSON', () => {
    expect(messageConsumer.parseMessageValue({ value: Buffer.from('not-json') })).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('parseMessageValue parses valid JSON', () => {
    const payload = { action: 'user.signed_up', email: 'a@b.com' };
    expect(messageConsumer.parseMessageValue({
      value: Buffer.from(JSON.stringify(payload)),
    })).toEqual(payload);
  });

  it('runConsumer invokes onEvent with parsed payload', async () => {
    const runMock = jest.fn(async ({ eachMessage }) => {
      await eachMessage({
        topic: 'user_profile_events',
        partition: 0,
        message: { value: Buffer.from(JSON.stringify({ action: 'user.signed_up' })) },
      });
    });
    const subscribeMock = jest.fn();
    kafkaConfig.getKafkaConsumer.mockReturnValue({
      subscribe: subscribeMock,
      run: runMock,
    });

    const onEvent = jest.fn();
    await messageConsumer.runConsumer({
      groupId: 'test-group',
      topics: ['user_profile_events'],
      onEvent,
    });

    expect(subscribeMock).toHaveBeenCalledWith({
      topics: ['user_profile_events'],
      fromBeginning: false,
    });
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'user_profile_events',
      payload: { action: 'user.signed_up' },
    }));
  });
});
