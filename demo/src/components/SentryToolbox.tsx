import React from 'react';
import * as Sentry from '@sentry/browser';

interface SentryToolboxProps {
  className?: string;
}

export const SentryToolbox: React.FC<SentryToolboxProps> = ({
  className = '',
}) => {
  const testError = () => {
    try {
      throw new Error('This is a test error from the demo ' + Math.random());
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const testMessage = () => {
    Sentry.captureMessage('This is a test message from the demo', 'info');
  };

  const testTransaction = () => {
    Sentry.startSpan({ name: 'demo-transaction', op: 'demo' }, () => {
      // Transaction completed
    });
  };

  const addBreadcrumb = () => {
    Sentry.addBreadcrumb({
      message: 'Demo breadcrumb added',
      category: 'demo',
      level: 'info',
      data: { timestamp: new Date().toISOString() },
    });
  };

  const setUserInfo = () => {
    Sentry.setUser({
      id: 'demo-user-123',
      email: 'demo@example.com',
      username: 'demo-user',
    });
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
      <h2 className='text-slate-800 mt-0'>Test Sentry Events</h2>
      <div className='flex flex-wrap gap-3 my-5'>
        <button onClick={testError} className='btn danger'>
          Test Error
        </button>
        <button onClick={testMessage} className='btn primary'>
          Test Message
        </button>
        <button onClick={testTransaction} className='btn'>
          Test Transaction
        </button>
        <button onClick={addBreadcrumb} className='btn'>
          Add Breadcrumb
        </button>
        <button onClick={setUserInfo} className='btn'>
          Set User Info
        </button>
      </div>
    </div>
  );
};
