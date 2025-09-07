#!/bin/bash
# Script to run all tests

echo "=== Running Game Logic Tests ==="
node run_gameLogic_tests.js

echo -e "\n=== Running Game Conditions Tests ==="
node test_gameConditions.js

echo -e "\n=== Running Integration Tests ==="
node test_integration.js

echo -e "\n=== All Tests Completed ==="