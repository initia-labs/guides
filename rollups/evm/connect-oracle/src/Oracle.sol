// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IConnectOracle {
    struct Price {
        uint256 price;
        uint256 timestamp;
        uint64 height;
        uint64 nonce;
        uint64 decimal;
        uint64 id;
    }

    function get_price(string memory pair_id) external view returns (Price memory);
    function get_prices(string[] memory pair_ids) external view returns (Price[] memory);
}

contract Oracle {
    IConnectOracle public connect;

    constructor(address oracleAddress) {
        connect = IConnectOracle(oracleAddress);
    }

    function getBTCPrice() external view returns (uint256 price, uint256 timestamp) {
        IConnectOracle.Price memory p = connect.get_price("BTC/USD");
        return (p.price, p.timestamp);
    }

    function getMultiplePrices() external view returns (uint256[] memory prices) {
        string[] memory pair_ids = new string[](2);
        pair_ids[0] = "BTC/USD";
        pair_ids[1] = "ETH/USD";

        IConnectOracle.Price[] memory result = connect.get_prices(pair_ids);

        prices = new uint256[](result.length);
        for (uint256 i = 0; i < result.length; i++) {
            prices[i] = result[i].price;
        }
    }
}