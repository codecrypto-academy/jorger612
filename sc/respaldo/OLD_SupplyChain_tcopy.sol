// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract oldSupplyChainTest is Test {
    SupplyChain public tracker;
    address public organization;
    bytes public defaultSignature;

    function setUp() public {
        tracker = new SupplyChain();
        organization = address(this);
        defaultSignature = hex"deadbeef";
    }

    // Tests for addEvent function
    function test_AddEvent() public {
        string memory label = "product1";
        uint256 timestamp = block.timestamp;

        vm.expectEmit(true, true, false, true);
        emit SupplyChain.EventAdded(label, address(this), timestamp);

        tracker.addEvent(label, timestamp, defaultSignature);

        SupplyChain.Event[] memory events = tracker.getEvents(label);
        assertEq(events.length, 1);
        assertEq(events[0].organization, address(this));
        assertEq(events[0].timestamp, timestamp);
        assertEq(events[0].signature, defaultSignature);
    }

    function test_AddEventFailEmptyLabel() public {
        vm.expectRevert("Label cannot be empty");
        tracker.addEvent("", block.timestamp, defaultSignature);
    }

    function test_AddEventFailInvalidTimestamp() public {
        vm.expectRevert("Invalid timestamp");
        tracker.addEvent("product1", 0, defaultSignature);
    }

    function test_AddEventFailEmptySignature() public {
        vm.expectRevert("Signature cannot be empty");
        tracker.addEvent("product1", block.timestamp, "");
    }

    // Tests for addEvents function
    function test_AddEvents() public {
        string[] memory labels = new string[](2);
        labels[0] = "product1";
        labels[1] = "product2";
        uint256 timestamp = block.timestamp;

        tracker.addEvents(labels, timestamp, defaultSignature);

        assertEq(tracker.getEventCount(labels[0]), 1);
        assertEq(tracker.getEventCount(labels[1]), 1);
    }

    function test_AddEventsFailEmptyArray() public {
        string[] memory labels = new string[](0);
        vm.expectRevert("Labels array cannot be empty");
        tracker.addEvents(labels, block.timestamp, defaultSignature);
    }

    function test_AddEventsFailEmptyLabel() public {
        string[] memory labels = new string[](2);
        labels[0] = "product1";
        labels[1] = "";

        vm.expectRevert("Label cannot be empty");
        tracker.addEvents(labels, block.timestamp, defaultSignature);
    }

    // Tests for getEvents function
    function test_GetEvents() public {
        string memory label = "product1";
        tracker.addEvent(label, block.timestamp, defaultSignature);
        tracker.addEvent(label, block.timestamp + 1, defaultSignature);

        SupplyChain.Event[] memory events = tracker.getEvents(label);
        assertEq(events.length, 2);
    }

    function test_GetEventsEmptyLabel() public {
        SupplyChain.Event[] memory events = tracker.getEvents("nonexistent");
        assertEq(events.length, 0);
    }

    // Tests for getEventCount function
    function test_GetEventCount() public {
        string memory label = "product1";
        tracker.addEvent(label, block.timestamp, defaultSignature);
        tracker.addEvent(label, block.timestamp + 1, defaultSignature);

        assertEq(tracker.getEventCount(label), 2);
    }

    function test_GetEventCountEmptyLabel() public {
        assertEq(tracker.getEventCount("nonexistent"), 0);
    }

    // Tests for getEvent function
    function test_GetEvent() public {
        string memory label = "product1";
        uint256 timestamp = block.timestamp;

        tracker.addEvent(label, timestamp, defaultSignature);

        (address org, uint256 ts, bytes memory sig) = tracker.getEvent(label, 0);

        assertEq(org, address(this));
        assertEq(ts, timestamp);
        assertEq(sig, defaultSignature);
    }

    function test_GetEventFailIndexOutOfBounds() public {
        string memory label = "product1";
        tracker.addEvent(label, block.timestamp, defaultSignature);

        vm.expectRevert("Event index out of bounds");
        tracker.getEvent(label, 1);
    }

    // Fuzz tests
    function test_Fuzz_AddEvent(
        string memory label,
        uint256 timestamp,
        bytes memory signature
    ) public {
        vm.assume(bytes(label).length > 0);
        vm.assume(timestamp > 0);
        vm.assume(signature.length > 0);

        tracker.addEvent(label, timestamp, signature);

        SupplyChain.Event[] memory events = tracker.getEvents(label);
        assertEq(events.length, 1);
        assertEq(events[0].organization, address(this));
        assertEq(events[0].timestamp, timestamp);
        assertEq(events[0].signature, signature);
    }
}
