jest.mock('../../../src/config/kafka', () => ({
  isKafkaEnabled: jest.fn(() => true),
  connectKafkaProducer: jest.fn(),
  getKafkaProducer: jest.fn(),
}));

const kafkaConfig = require('../../../src/config/kafka');
const messageProducer = require('../../../src/common/events/messageProducer');

describe('common/events/messageProducer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kafkaConfig.isKafkaEnabled.mockReturnValue(true);
    kafkaConfig.connectKafkaProducer.mockResolvedValue(true);
    kafkaConfig.getKafkaProducer.mockReturnValue({ send: jest.fn().mockResolvedValue(true) });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('publishes event to kafka', async () => {
    const sendMock = jest.fn().mockResolvedValue(true);
    kafkaConfig.getKafkaProducer.mockReturnValue({ send: sendMock });

    const result = await messageProducer.pushMessage({
      topic: 'order_events',
      key: '123',
      payload: { id: '123', action: 'order.created' },
    });

    expect(result).toBe(true);
    expect(sendMock).toHaveBeenCalledWith({
      topic: 'order_events',
      messages: [{
        key: '123',
        value: JSON.stringify({ id: '123', action: 'order.created' }),
      }],
    });
  });

  it('returns false and logs when publish fails', async () => {
    const sendMock = jest.fn().mockRejectedValue(new Error('broker unavailable'));
    kafkaConfig.getKafkaProducer.mockReturnValue({ send: sendMock });

    const result = await messageProducer.pushMessage({
      topic: 'order_events',
      key: '123',
      payload: { id: '123', action: 'order.updated' },
      context: { orderId: '123' },
    });

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});
