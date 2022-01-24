import { expect } from 'chai';
import { MAX_UINT_AMOUNT } from '../../helpers/constants';
import { ProtocolErrors } from '../../helpers/types';
import { wei } from './helpers';
import { setup } from './__setup.spec';
import asserts from './asserts';
import BigNumber from 'bignumber.js';

describe('AStETH Withdraws:', function () {
  it('Withdraw all max uint256: should withdraw correct amount', async () => {
    const { lenderA } = setup.lenders;

    await lenderA.depositStEth(wei(10));
    const lenderABalanceAfterDeposit = await lenderA.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthTotalSupply(setup, wei(10));

    await lenderA.withdrawStEth(MAX_UINT_AMOUNT);
    await asserts.astEthBalance(lenderA, '1');
    await asserts.astEthTotalSupply(setup, '1');
    await asserts.lte(
      await lenderA.stEthBalance(),
      new BigNumber(lenderABalanceAfterDeposit).plus(wei(10)).toFixed(0),
      '2'
    );
  });

  it('Withdraw all sum: should withdraw correct amount', async () => {
    const { lenderA } = setup.lenders;

    await lenderA.depositStEth(wei(10));
    const lenderABalanceAfterDeposit = await lenderA.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthTotalSupply(setup, wei(10));

    await lenderA.withdrawStEth(await lenderA.astEthBalance());
    await asserts.astEthBalance(lenderA, '1');
    await asserts.astEthTotalSupply(setup, '1');
    await asserts.lte(
      await lenderA.stEthBalance(),
      new BigNumber(lenderABalanceAfterDeposit).plus(wei(10)).toFixed(0),
      '2'
    );
  });

  it('Partial withdraw: should withdraw correct amount', async () => {
    const { lenderA } = setup.lenders;

    await lenderA.depositStEth(wei(10));
    const lenderABalanceAfterDeposit = await lenderA.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthTotalSupply(setup, wei(10));

    await lenderA.withdrawStEth(wei(5));
    await asserts.astEthBalance(lenderA, wei(5));
    await asserts.astEthTotalSupply(setup, wei(5));
    await asserts.lte(
      await lenderA.stEthBalance(),
      new BigNumber(lenderABalanceAfterDeposit).plus(wei(5)).toFixed(0),
      '2'
    );
  });

  it('Multiple withdraws: should withdraw correct amount', async () => {
    const { lenderA, lenderB } = setup.lenders;

    await lenderA.depositStEth(wei(10));
    const lenderABalanceAfterDeposit = await lenderA.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthBalance(lenderB, wei(0));
    await asserts.astEthTotalSupply(setup, wei(10));

    await lenderB.depositStEth(wei(20));
    const lenderBBalanceAfterDeposit = await lenderB.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthBalance(lenderB, wei(20));
    await asserts.astEthTotalSupply(setup, wei(30), '2');

    await lenderA.withdrawStEth(wei(5));
    // after withdraw user can still hold one share on balance, so we count it here
    const lenderAExpectedAstEthBalanceAfterWithdraw = new BigNumber(wei(5)).plus(1).toString();
    await asserts.astEthBalance(lenderA, lenderAExpectedAstEthBalanceAfterWithdraw);
    await asserts.astEthBalance(lenderB, wei(20));
    await asserts.astEthTotalSupply(setup, wei(25), '2');
    await asserts.lte(
      await lenderA.stEthBalance(),
      new BigNumber(lenderABalanceAfterDeposit).plus(wei(5)).toFixed(0),
      '2'
    );

    await lenderB.withdrawStEth(MAX_UINT_AMOUNT);
    await asserts.astEthBalance(lenderA, lenderAExpectedAstEthBalanceAfterWithdraw);
    await asserts.astEthBalance(lenderB, '1');
    // after two withdraws astETH may still has couple of shares
    const expectedAstEthTotalSupply = new BigNumber(wei(5)).plus(2).toFixed(0);
    await asserts.astEthTotalSupply(setup, expectedAstEthTotalSupply, '2');
    await asserts.lte(
      await lenderB.stEthBalance(),
      new BigNumber(lenderBBalanceAfterDeposit).plus(wei(20)).toFixed(0),
      '2'
    );
  });

  it('Withdraw after rebase: should withdraw correct amount', async () => {
    const { lenderA, lenderB } = setup.lenders;

    await lenderA.depositStEth(wei(10));
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthBalance(lenderB, wei(0));
    await asserts.astEthTotalSupply(setup, wei(10));

    await lenderB.depositStEth(wei(20));
    await asserts.astEthBalance(lenderA, wei(10));
    await asserts.astEthBalance(lenderB, wei(20));
    await asserts.astEthTotalSupply(setup, wei(30), '2');

    // positive rebase
    await setup.rebaseStETH(0.1);
    const lenderABalanceAfterRebase = await lenderA.stEthBalance();
    const lenderBBalanceAfterRebase = await lenderB.stEthBalance();
    await asserts.astEthBalance(lenderA, wei(11));
    await asserts.astEthBalance(lenderB, wei(22));
    await asserts.astEthTotalSupply(setup, wei(33), '2');

    await lenderA.withdrawStEth(wei(10));
    // after withdraw user can still hold one share on balance, so we count it here
    const lenderAExpectedAstEthBalanceAfterWithdraw = new BigNumber(wei(1)).plus(1).toString();
    await asserts.astEthBalance(lenderA, lenderAExpectedAstEthBalanceAfterWithdraw);
    await asserts.astEthBalance(lenderB, wei(22));
    await asserts.astEthTotalSupply(setup, wei(23), '2');
    await asserts.lte(
      await lenderA.stEthBalance(),
      new BigNumber(lenderABalanceAfterRebase).plus(wei(10)).toFixed(0),
      '2'
    );

    await lenderB.withdrawStEth(MAX_UINT_AMOUNT);
    await asserts.astEthBalance(lenderA, lenderAExpectedAstEthBalanceAfterWithdraw);
    await asserts.astEthBalance(lenderB, '1');
    // after two withdraws astETH may still has couple of shares
    const expectedAstEthTotalSupply = new BigNumber(wei(1)).plus(2).toFixed(0);
    await asserts.astEthTotalSupply(setup, expectedAstEthTotalSupply, '2');
    await asserts.lte(
      await lenderB.stEthBalance(),
      new BigNumber(lenderBBalanceAfterRebase).plus(wei(22)).toFixed(0),
      '2'
    );
  });

  it('Withdraw scaled amount is zero: should revert with correct message', async () => {
    const { lenderA } = setup.lenders;
    await lenderA.depositStEth(wei(1));
    // rebase 200%
    await setup.rebaseStETH(2);
    // try to withdraw 1 wei after rebase happened
    // which will be 0 after scaling
    await expect(lenderA.withdrawStEth(1)).to.revertedWith(ProtocolErrors.CT_INVALID_BURN_AMOUNT);
  });
});