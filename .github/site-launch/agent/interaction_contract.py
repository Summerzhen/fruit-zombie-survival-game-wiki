"""Typed browser outcome assertions shared by capture and validation."""


def assertions_for(test):
    assertions = test.get('assertions')
    if assertions is None:
        assertions = [dict(kind='text', selector=test.get('expectSelector'), expected=test.get('expectedText'))]
    if not isinstance(assertions, list) or not assertions:
        raise ValueError('assertions must be a non-empty list')
    for item in assertions:
        if not isinstance(item, dict) or item.get('kind') not in {'text', 'count', 'visible', 'hidden', 'checked', 'url'}:
            raise ValueError('unsupported assertion kind')
        kind, expected = item['kind'], item.get('expected')
        if kind != 'url' and (not isinstance(item.get('selector'), str) or not item['selector'].strip()):
            raise ValueError('assertion selector is required')
        if kind in {'text', 'url'} and (not isinstance(expected, str) or not expected.strip()):
            raise ValueError('text/url assertion requires expected text')
        if kind == 'count' and (type(expected) is not int or expected < 0):
            raise ValueError('count assertion requires nonnegative integer')
        if kind in {'visible', 'hidden', 'checked'} and type(expected) is not bool:
            raise ValueError('state assertion requires boolean expected')
    return assertions


def matches(assertion, value):
    expected = assertion['expected']
    if assertion['kind'] == 'text':
        return isinstance(value, str) and expected in value
    return type(value) is type(expected) and value == expected
