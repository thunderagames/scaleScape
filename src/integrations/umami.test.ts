import { describe, expect, it } from 'vitest'
import { installUmamiTracker } from './umami'

describe('Umami integration', () => {
  it('given_missing_configuration_when_installing_then_does_not_add_a_script', () => {
    const document_ref = document.implementation.createHTMLDocument('test')

    installUmamiTracker(document_ref)

    expect(document_ref.head.querySelector('script')).toBeNull()
  })
})
