import { expect } from 'chai';
import { merge, exclude, parse, ip2bigint, bigint2ip, contains, expand, overlap } from '../src';
// import { merge, exclude } from '../build/debug.js';

describe('cidr-tools-wasm', () => {
  it('ip2bigint, bigint2ip', () => {
    expect(bigint2ip(ip2bigint('6620:0:1ff2::', 6), 6)).to.eql('6620:0:1ff2::');
  });

  it('parse', () => {
    const obj = parse('::/64');
    expect(obj[2]).to.eql(6);
    expect(obj[0]).to.eql(0n);
    expect(obj[1]).to.eql(18_446_744_073_709_551_615n);
  });

  it('merge', () => {
    expect(merge(['0.0.0.0', '0.0.0.1'])).to.eql(['0.0.0.0/31']);
    expect(merge(['0.0.0.0', '0.0.0.2'])).to.eql(['0.0.0.0/32', '0.0.0.2/32']);
    expect(merge(['1.0.0.0', '1.0.0.1'])).to.eql(['1.0.0.0/31']);
    expect(merge(['1.0.0.0/24', '1.0.1.0/24'])).to.eql(['1.0.0.0/23']);
    expect(merge(['1.0.0.0/24', '1.0.0.0'])).to.eql(['1.0.0.0/24']);
    expect(merge(['1.0.0.0/24', '1.0.0.0/12'])).to.eql(['1.0.0.0/12']);
    expect(merge(['0.0.0.0/8', '1.0.0.0/8'])).to.eql(['0.0.0.0/7']);
    expect(merge(['4.0.0.0/8', '4.0.0.0/12', '4.0.0.0/16'])).to.eql(['4.0.0.0/8']);
    expect(merge(['0.0.0.1/32', '0.0.0.2/32'])).to.eql(['0.0.0.1/32', '0.0.0.2/32']);
    expect(merge(['0.0.1.0/24', '0.0.2.0/24', '0.0.3.0/24', '0.0.4.0/24'])).to.eql(['0.0.2.0/23', '0.0.1.0/24', '0.0.4.0/24']);
    expect(merge(['0.0.175.0/24', '0.0.176.0/21', '0.0.184.0/21', '0.0.192.0/24'])).to.eql(['0.0.176.0/20', '0.0.175.0/24', '0.0.192.0/24']);
    expect(merge(['0.0.176.0/21', '0.0.184.0/21', '0.0.192.0/24'])).to.eql(['0.0.176.0/20', '0.0.192.0/24']);

    expect(merge(['::0/128', '::1/128'])).to.eql(['::/127']);
    expect(merge(['::0', '::1'])).to.eql(['::/127']);
    expect(merge(['6620:0:1ff2::/70'])).to.eql(['6620:0:1ff2::/70']);
    expect(merge(['1:1:1:1::/128', '1:1:1:2::/128'])).to.eql(['1:1:1:1::/128', '1:1:1:2::/128']);
    expect(merge(['1:1:1:2::/128', '1:1:1:1::/128'])).to.eql(['1:1:1:1::/128', '1:1:1:2::/128']);
    expect(merge(['::2:0:0/128', '::1:0:0/128'])).to.eql(['::1:0:0/128', '::2:0:0/128']);
    expect(merge(['::2:0:0/128', '::1:0:0/128', '::2:0:1/128'])).to.eql(['::1:0:0/128', '::2:0:0/127']);

    expect(merge(['0:0:0:0:0:100:0:0:1/128', '0:0:0:0:0:100:0:0:3/128'])).to.eql(['::100:0:0:1/128', '::100:0:0:3/128']);
    expect(merge(['2001:2160:7:30e::f8/128', '2001:2160:7:30e::fe/128'])).to.eql(['2001:2160:7:30e::f8/128', '2001:2160:7:30e::fe/128']);
  });

  it('exclude', () => {
    expect(exclude(['1.0.0.0/23'], ['1.0.1.0/24'])).to.eql(['1.0.0.0/24']);
    expect(exclude(['1.0.0.0/24'], ['1.0.0.0/16'])).to.eql([]);
    expect(exclude(['1.0.0.0/24'], ['1.0.0.0'])).to.eql(['1.0.0.128/25', '1.0.0.64/26', '1.0.0.32/27', '1.0.0.16/28', '1.0.0.8/29', '1.0.0.4/30', '1.0.0.2/31', '1.0.0.1/32']);
    expect(exclude(['10.11.0.0/16'], ['10.11.70.0/24'])).to.eql(['10.11.0.0/18', '10.11.64.0/22', '10.11.68.0/23', '10.11.128.0/17', '10.11.96.0/19', '10.11.80.0/20', '10.11.72.0/21', '10.11.71.0/24']);
    expect(exclude(['0.0.0.0/30'], ['0.0.0.1/32', '0.0.0.2/32'])).to.eql(['0.0.0.0/32', '0.0.0.3/32']);
    expect(exclude(['0.0.0.0/0'], ['127.0.0.0/1'])).to.eql(['128.0.0.0/1']);

    expect(exclude(['::/127'], ['::1/128'])).to.eql(['::/128']);
    expect(exclude(['::/120'], ['::1/112'])).to.eql([]);
    expect(exclude(['::0/127', '1.2.3.0/24'], ['::/128'])).to.eql(['1.2.3.0/24', '::1/128']);
    expect(exclude(['::0/127', '1.2.3.0/24'], ['::/0', '0.0.0.0/0'])).to.eql([]);
  });

  it('expand', () => {
    expect(expand(['1.2.3.0/31'])).to.eql(['1.2.3.0', '1.2.3.1']);
    expect(expand(['1::/126'])).to.eql(['1::', '1::1', '1::2', '1::3']);
    expect(expand(['2008:db1::/127'])).to.eql(['2008:db1::', '2008:db1::1']);
    expect(expand(['2008:db1::/127'])).to.eql(['2008:db1::', '2008:db1::1']);
  });

  it('overlap', () => {
    expect(overlap(['1.0.0.0/24'], ['1.0.0.0/30'])).to.eql(true, '1');
    expect(overlap(['2::/8'], ['1::/8'])).to.eql(true, '2');
    expect(overlap(['1.0.0.0/25'], ['1.0.0.128/25'])).to.eql(false, '3');
    expect(overlap(['0.0.0.0/0'], ['::0/0'])).to.eql(false, '4');
    expect(overlap(['2::/64'], ['1::/64'])).to.eql(false, '5');
    expect(overlap(['1.0.0.0/24'], ['1.0.0.0/30'])).to.eql(true, '6');
    expect(overlap(['1.0.0.0', '2.0.0.0'], ['0.0.0.0/6'])).to.eql(true, '7');
    expect(overlap(['::1'], ['0.0.0.1'])).to.eql(false, '8');
    expect(overlap(['fe80:1:0:0:0:0:0:0'], ['fe80::/10'])).to.eql(true, '9');
    expect(overlap(['::1'], ['0.0.0.1', '0.0.0.2'])).to.eql(false, '10');
  });

  it('contains', () => {
    expect(contains(['1.0.0.0'], ['1.0.0.0'])).to.eql(true);
    expect(contains(['1.0.0.0'], ['1.0.0.1'])).to.eql(false);
    expect(contains(['1.0.0.0'], ['1.0.0.1/24'])).to.eql(false);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1/24'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.1.1'])).to.eql(false);
    expect(contains(['0.0.0.0/24'], ['::'])).to.eql(false);
    expect(contains(['0.0.0.0/0'], ['::'])).to.eql(false);
    expect(contains(['0.0.0.0/0'], ['::1'])).to.eql(false);
    expect(contains(['0.0.0.0/0'], ['0.0.0.0/0'])).to.eql(true);
    expect(contains(['::/64'], ['::'])).to.eql(true);
    expect(contains(['::/64'], ['::/64'])).to.eql(true);
    expect(contains(['::/64'], ['::/96'])).to.eql(true);
    expect(contains(['::/96'], ['::/64'])).to.eql(false);
    expect(contains(['::/128'], ['::1'])).to.eql(false);
    expect(contains(['::/128'], ['::'])).to.eql(true);
    expect(contains(['::/128'], ['::/128'])).to.eql(true);
    expect(contains(['::/120'], ['::/128'])).to.eql(true);
    expect(contains(['::/128'], ['0.0.0.0'])).to.eql(false);
    expect(contains(['::/128'], ['0.0.0.1'])).to.eql(false);
    expect(contains(['::/128'], ['::/128'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '2.0.0.0'], ['1.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '2.0.0.0'], ['3.0.0.1'])).to.eql(false);
    expect(contains(['1.0.0.0/24', '::/0'], ['3.0.0.1'])).to.eql(false);
    expect(contains(['1.0.0.0/24', '::/0', '3.0.0.0/24'], ['3.0.0.1'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '::/0', '3.0.0.0/24'], ['::1'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '::/0', '3.0.0.0/24'], ['::1'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '::/0', '3.0.0.0/24'], ['::1', '::2'])).to.eql(true);
    expect(contains(['1.0.0.0/24', '::/128', '3.0.0.0/24'], ['::1'])).to.eql(false);
    expect(contains(['1.0.0.0/24', '::/128', '3.0.0.0/24'], ['::1', '::2'])).to.eql(false);
    expect(contains(['fe80::%int'], ['fe80::'])).to.eql(true);
    expect(contains(['fe80::%int'], ['fe80::%int'])).to.eql(true);
    expect(contains(['fe80::'], ['fe80::%int'])).to.eql(true);
    expect(contains(['fe80::%int/64'], ['fe80::/64'])).to.eql(true);
    expect(contains(['fe80::%int/64'], ['fe80::%int/64'])).to.eql(true);
    expect(contains(['fe80::/64'], ['fe80::%int/64'])).to.eql(true);

    const privates = [
      '10.0.0.0/8',
      '100.64.0.0/10',
      '127.0.0.1/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '::1/128',
      'fc00::/7',
      'fe80::/64'
    ];

    expect(contains(privates, ['127.0.0.1'])).to.eql(true);
    expect(contains(privates, ['127.255.255.255'])).to.eql(true);
    expect(contains(privates, ['100.64.0.0/24'])).to.eql(true);
    expect(contains(privates, ['::1'])).to.eql(true);
    expect(contains(privates, ['::2'])).to.eql(false);
    expect(contains(privates, ['fe80::1'])).to.eql(true);
    expect(contains(privates, ['127.0.0.1', '::1'])).to.eql(true);
    expect(contains(privates, ['127.0.0.1', '::1/64'])).to.eql(false);
    expect(contains(privates, ['127.0.0.1', '::2'])).to.eql(false);
    expect(contains(privates, ['128.0.0.0', '::1'])).to.eql(false);
    expect(contains(privates, ['127.0.0.1', 'fc00::'])).to.eql(true);
    expect(contains(privates, ['127.0.0.1', '192.168.255.255', 'fe80::2'])).to.eql(true);
  });
});
