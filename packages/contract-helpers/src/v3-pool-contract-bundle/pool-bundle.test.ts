import { BigNumber, providers } from 'ethers';
import { API_ETH_MOCK_ADDRESS } from '../commons/utils';
import { PoolBundle } from './index';

jest.mock('../commons/gasStation', () => {
  return {
    __esModule: true,
    estimateGasByNetwork: jest
      .fn()
      .mockImplementation(async () => Promise.resolve(BigNumber.from(1))),
    estimateGas: jest.fn(async () => Promise.resolve(BigNumber.from(1))),
  };
});

describe('PoolBundle', () => {
  const provider = new providers.JsonRpcProvider();
  jest
    .spyOn(provider, 'getGasPrice')
    .mockImplementation(async () => Promise.resolve(BigNumber.from(1)));
  const POOL = '0x0000000000000000000000000000000000000001';
  const WETH_GATEWAY = '0x0000000000000000000000000000000000000002';
  const USER = '0x0000000000000000000000000000000000000003';
  const TOKEN = '0x0000000000000000000000000000000000000004';
  const FLASH_LIQUIDATION_ADAPTER =
    '0x0000000000000000000000000000000000000003';
  const REPAY_WITH_COLLATERAL_ADAPTER =
    '0x0000000000000000000000000000000000000004';
  const SWAP_COLLATERAL_ADAPTER = '0x0000000000000000000000000000000000000005';
  const L2_ENCODER = '0x0000000000000000000000000000000000000020';
  describe('Initialization', () => {
    const config = {
      POOL,
      FLASH_LIQUIDATION_ADAPTER,
      REPAY_WITH_COLLATERAL_ADAPTER,
      SWAP_COLLATERAL_ADAPTER,
      WETH_GATEWAY,
      L2_ENCODER,
    };
    it('Expects to initialize correctly with all params', () => {
      const instance = new PoolBundle(provider, config);
      expect(instance instanceof PoolBundle).toEqual(true);
    });
    it('Expects to initialize correctly without passing configuration', () => {
      const instance = new PoolBundle(provider);
      expect(instance instanceof PoolBundle).toEqual(true);
    });
  });

  describe('SupplyTxBuilder', () => {
    const config = {
      POOL,
      FLASH_LIQUIDATION_ADAPTER,
      REPAY_WITH_COLLATERAL_ADAPTER,
      SWAP_COLLATERAL_ADAPTER,
      WETH_GATEWAY,
      L2_ENCODER,
    };

    const instance = new PoolBundle(provider, config);

    it('gets approved amount for Pool', async () => {
      jest
        .spyOn(instance.erc20Service, 'approvedAmount')
        .mockReturnValue(Promise.resolve(1));

      const result = await instance.supplyTxBuilder.getApprovedAmount({
        user: USER,
        token: TOKEN,
      });
      expect(result.amount).toEqual('1');
      expect(result.spender).toEqual(POOL);
      expect(result.token).toEqual(TOKEN);
      expect(result.user).toEqual(USER);
    });

    it('gets approved amount for WETHGateway', async () => {
      jest
        .spyOn(instance.erc20Service, 'approvedAmount')
        .mockReturnValue(Promise.resolve(1));

      const result = await instance.supplyTxBuilder.getApprovedAmount({
        user: USER,
        token: API_ETH_MOCK_ADDRESS,
      });
      expect(result.amount).toEqual('1');
      expect(result.spender).toEqual(WETH_GATEWAY);
      expect(result.token).toEqual(API_ETH_MOCK_ADDRESS);
      expect(result.user).toEqual(USER);
    });

    it('generates supply tx data with generateTxData', () => {
      const result = instance.supplyTxBuilder.generateTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
      });

      const differentParamsSameResult = instance.supplyTxBuilder.generateTxData(
        {
          user: USER,
          reserve: TOKEN,
          amount: '1',
        },
      );

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0x617ba0370000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x617ba0370000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('generates supply tx for WETHGateway data with generateTxData', () => {
      const result = instance.supplyTxBuilder.generateTxData({
        user: USER,
        reserve: API_ETH_MOCK_ADDRESS.toLowerCase(),
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
      });

      const differentParamsSameResult = instance.supplyTxBuilder.generateTxData(
        {
          user: USER,
          reserve: API_ETH_MOCK_ADDRESS.toLowerCase(),
          amount: '1',
        },
      );
      expect(result.to).toEqual(WETH_GATEWAY);
      expect(result.from).toEqual(USER);
      expect(result.value).toEqual(BigNumber.from('1'));
      expect(result.data).toEqual(
        '0x474cf53d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(differentParamsSameResult.to).toEqual(WETH_GATEWAY);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x474cf53d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('generates supply tx data with generateTxData and L2POOL', () => {
      const result = instance.supplyTxBuilder.generateTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
        useOptimizedPath: true,
      });

      const differentParamsSameResult = instance.supplyTxBuilder.generateTxData(
        {
          user: USER,
          reserve: TOKEN,
          amount: '1',
          useOptimizedPath: true,
        },
      );

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0x617ba0370000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x617ba0370000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('generates supply tx data with generateTxData and L2POOL with encoded txData', () => {
      const result = instance.supplyTxBuilder.generateTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
        useOptimizedPath: true,
        encodedTxData:
          '0x0000000000000000000000000000000000000000000000000000006d6168616d',
      });

      const differentParamsSameResult = instance.supplyTxBuilder.generateTxData(
        {
          user: USER,
          reserve: TOKEN,
          amount: '1',
          useOptimizedPath: true,
          onBehalfOf: USER,
          encodedTxData:
            '0x0000000000000000000000000000000000000000000000000000006d6168616d',
        },
      );

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0xf7a738400000000000000000000000000000000000000000000000000000006d6168616d',
      );
      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0xf7a738400000000000000000000000000000000000000000000000000000006d6168616d',
      );
    });

    it('generates signed tx with generateSignedTxData', () => {
      const result = instance.supplyTxBuilder.generateSignedTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
        signature:
          '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
        deadline: '10000',
      });

      const differentParamsSameResult =
        instance.supplyTxBuilder.generateSignedTxData({
          user: USER,
          reserve: TOKEN,
          amount: '1',

          signature:
            '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
          deadline: '10000',
        });

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0x02c205f000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000001c532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );
      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x02c205f000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000001c532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );
    });

    it('generates signed tx with generateSignedTxData with L2POOL', () => {
      const result = instance.supplyTxBuilder.generateSignedTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
        signature:
          '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
        deadline: '10000',
        useOptimizedPath: true,
      });

      const differentParamsSameResult =
        instance.supplyTxBuilder.generateSignedTxData({
          user: USER,
          reserve: TOKEN,
          amount: '1',
          signature:
            '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
          deadline: '10000',
          useOptimizedPath: true,
        });

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0x02c205f000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000001c532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );
      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x02c205f000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002710000000000000000000000000000000000000000000000000000000000000001c532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );
    });

    it('generates signed tx with generateSignedTxData with L2POOL with encoded txData', () => {
      const result = instance.supplyTxBuilder.generateSignedTxData({
        user: USER,
        reserve: TOKEN,
        amount: '1',
        onBehalfOf: USER,
        referralCode: '0',
        signature:
          '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
        deadline: '10000',
        useOptimizedPath: true,
        encodedTxData:
          '0x0000000000000000000000000000000000000000000000000000006d6168616d',
      });

      const differentParamsSameResult =
        instance.supplyTxBuilder.generateSignedTxData({
          user: USER,
          reserve: TOKEN,
          amount: '1',
          referralCode: '0',
          signature:
            '0x532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb41c',
          deadline: '10000',
          useOptimizedPath: true,
          encodedTxData:
            '0x0000000000000000000000000000000000000000000000000000006d6168616d',
        });

      expect(result.to).toEqual(POOL);
      expect(result.from).toEqual(USER);
      expect(result.data).toEqual(
        '0x680dd47c0000000000000000000000000000000000000000000000000000006d6168616d532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );

      expect(differentParamsSameResult.to).toEqual(POOL);
      expect(differentParamsSameResult.from).toEqual(USER);
      expect(differentParamsSameResult.data).toEqual(
        '0x680dd47c0000000000000000000000000000000000000000000000000000006d6168616d532f8df4e2502bd869fb35e9301156f9b307380afdcc25cfbc87b2e939f16f7e47c326dc26eb918d327358797ee67ad7415d871ef7eaf0d4f6352d3ad021fbb4',
      );
    });
  });
});
