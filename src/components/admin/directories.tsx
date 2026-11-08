'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/trpc/react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Pencil,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import s from './admin.module.css';
import type { AdminProfile, AdminUser } from './preview-data';
import {
  Avatar,
  Empty,
  Pagination,
  PlanBadge,
  QueryState,
  date,
  downloadCsv,
  number,
} from './shared';

type Notice = (message: string, error?: boolean) => void;

function UserEditor({
  selected,
  onClose,
  onSave,
  busy,
}: {
  selected: AdminUser | null;
  onClose: () => void;
  onSave: (value: {
    id: string;
    name: string;
    aiCredits: number;
    emailVerified: boolean;
  }) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(selected?.name ?? '');
  const [credits, setCredits] = useState(selected?.aiCredits ?? 0);
  const [verified, setVerified] = useState(selected?.emailVerified ?? false);
  return (
    <Dialog
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          onClose();
        }
      }}
    >
      <DialogContent className={s.modal} showClose={!busy}>
        <div className={s.modalIcon}>
          <Pencil size={20} />
        </div>
        <DialogTitle>Edit community member</DialogTitle>
        <DialogDescription>{selected?.email}</DialogDescription>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (selected) {
              onSave({
                id: selected.id,
                name,
                aiCredits: credits,
                emailVerified: verified,
              });
            }
          }}
          className={s.editForm}
        >
          <label htmlFor="admin-name">
            Display name
            <input
              id="admin-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label htmlFor="admin-credits">
            Available AI credits
            <input
              id="admin-credits"
              type="number"
              required
              min={0}
              max={100000}
              step={1}
              value={credits}
              onChange={(event) => setCredits(Number(event.target.value))}
            />
            <small>
              Sets the current balance. Monthly plan resets still apply.
            </small>
          </label>
          <label className={s.checkLabel}>
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
            />{' '}
            Email address verified
          </label>
          <p className={s.formNote}>
            Subscription plans are managed by Polar. Billing information is
            available in Subscriptions.
          </p>
          <div className={s.modalActions}>
            <button
              type="button"
              className={s.secondaryButton}
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={s.primaryButton}
              disabled={busy || !name.trim()}
            >
              {busy ? 'Saving…' : 'Save changes'}
              <Check size={15} />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserDirectory({
  demo,
  previewUsers,
  setPreviewUsers,
  initialSearch = '',
  subscriptions = false,
  notify,
}: {
  demo: boolean;
  previewUsers: AdminUser[];
  setPreviewUsers: (users: AdminUser[]) => void;
  initialSearch?: string;
  subscriptions?: boolean;
  notify: Notice;
}) {
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [plan, setPlan] = useState<'all' | 'free' | 'pro' | 'business'>('all');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [revoke, setRevoke] = useState<AdminUser | null>(null);
  const query = api.admin.users.useQuery(
    { search: debouncedSearch, page, plan },
    { enabled: !demo }
  );
  const utils = api.useUtils();
  const update = api.admin.updateUser.useMutation();
  const revokeSessions = api.admin.revokeSessions.useMutation();
  const filtered = previewUsers.filter(
    (user) =>
      (!debouncedSearch ||
        `${user.name} ${user.email} ${user.id}`
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())) &&
      (plan === 'all' || user.plan === plan)
  );
  const data = demo
    ? {
        items: filtered.slice((page - 1) * 12, page * 12),
        total: filtered.length,
        pageSize: 12,
      }
    : query.data;
  const save = async (value: {
    id: string;
    name: string;
    aiCredits: number;
    emailVerified: boolean;
  }) => {
    try {
      if (demo) {
        setPreviewUsers(
          previewUsers.map((user) =>
            user.id === value.id ? { ...user, ...value } : user
          )
        );
      } else {
        await update.mutateAsync(value);
        await Promise.all([
          utils.admin.users.invalidate(),
          utils.admin.overview.invalidate(),
        ]);
      }
      setSelected(null);
      notify(
        demo
          ? 'Preview member updated. Changes last for this visit.'
          : 'Member updated successfully.'
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not save this member.',
        true
      );
    }
  };
  const confirmRevoke = async () => {
    if (!revoke) {
      return;
    }
    try {
      if (demo) {
        notify('Preview: all sessions revoked. No real account was changed.');
      } else {
        const result = await revokeSessions.mutateAsync({ id: revoke.id });
        notify(
          `${number(result.count)} session${result.count === 1 ? '' : 's'} revoked.`
        );
      }
      setRevoke(null);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not revoke sessions.',
        true
      );
    }
  };
  return (
    <>
      {subscriptions ? (
        <div className={s.infoBanner}>
          <ShieldCheck size={20} />
          <div>
            <strong>Subscription records</strong>
            <p>
              Recorded subscription IDs and end dates from Polar webhooks.
              Manage charges and cancellations in your Polar dashboard.
            </p>
          </div>
          <a
            href="https://polar.sh/dashboard"
            target="_blank"
            rel="noreferrer"
            className={s.textButton}
          >
            Open Polar <ArrowUpRight size={15} />
          </a>
        </div>
      ) : null}
      <section className={s.panel}>
        <div className={s.directoryHeading}>
          <div>
            <h2>
              {subscriptions ? 'Accounts & subscriptions' : 'Users'}
              <span className={s.countBadge}>{number(data?.total ?? 0)}</span>
            </h2>
            <p>
              {subscriptions
                ? 'Subscription records for every account, including free members.'
                : 'Search and manage OpenBio accounts.'}
            </p>
          </div>
          <button
            type="button"
            className={s.secondaryButton}
            disabled={!data?.items.length}
            onClick={() => {
              if (data) {
                downloadCsv(
                  `openbio-${subscriptions ? 'subscriptions' : 'users'}-page-${page}.csv`,
                  [
                    [
                      'ID',
                      'Name',
                      'Email',
                      'Plan',
                      'Email verified',
                      'AI credits',
                      'Profiles',
                      'Created at',
                      'Subscription ID',
                      'Subscription ends at',
                    ],
                    ...data.items.map((user) => [
                      user.id,
                      user.name,
                      user.email,
                      user.plan,
                      user.emailVerified ? 'Yes' : 'No',
                      user.aiCredits,
                      user.profileCount,
                      user.createdAt.toISOString(),
                      user.subscriptionId,
                      user.subscriptionEndsAt?.toISOString() ?? null,
                    ]),
                  ]
                );
              }
            }}
          >
            <ArrowDownToLine size={14} />
            Export page
          </button>
        </div>
        <div className={s.filters}>
          <label className={s.searchField}>
            <Search size={16} />
            <input
              aria-label="Search users"
              maxLength={100}
              placeholder="Search by name, email, or user ID…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className={s.selectLabel}>
            Plan
            <select
              aria-label="Filter by plan"
              value={plan}
              onChange={(event) => {
                setPlan(event.target.value as typeof plan);
                setPage(1);
              }}
            >
              <option value="all">All plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </label>
        </div>
        {!demo && (query.isPending || query.error) ? (
          <QueryState
            loading={query.isPending}
            error={query.error?.message}
            retry={() => query.refetch()}
          />
        ) : data?.items.length ? (
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  {subscriptions ? (
                    <>
                      <th>Subscription</th>
                      <th>Period ends</th>
                    </>
                  ) : (
                    <>
                      <th>Status</th>
                      <th>Profiles</th>
                      <th>AI credits</th>
                      <th>Joined</th>
                      <th className={s.actionsHeading}>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((user, i) => (
                  <tr key={user.id}>
                    <td>
                      <div className={s.person}>
                        <Avatar name={user.name} index={i} />
                        <div>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PlanBadge plan={user.plan} />
                    </td>
                    {subscriptions ? (
                      <>
                        <td>
                          <div className={s.subscriptionCell}>
                            <span
                              className={s.status}
                              data-active={Boolean(
                                user.subscriptionId &&
                                  (!user.subscriptionEndsAt ||
                                    new Date(user.subscriptionEndsAt) >
                                      new Date())
                              )}
                            >
                              <i />
                              {user.subscriptionId
                                ? user.subscriptionEndsAt &&
                                  new Date(user.subscriptionEndsAt) <=
                                    new Date()
                                  ? 'Period ended'
                                  : 'On record'
                                : 'No subscription'}
                            </span>
                            <small title={user.subscriptionId ?? ''}>
                              {user.subscriptionId ?? 'Free account'}
                            </small>
                          </div>
                        </td>
                        <td className={s.muted}>
                          {date(user.subscriptionEndsAt)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span
                            className={s.status}
                            data-active={user.emailVerified}
                          >
                            <i />
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td>{user.profileCount}</td>
                        <td>{number(user.aiCredits)}</td>
                        <td className={s.muted}>{date(user.createdAt)}</td>
                        <td>
                          <div className={s.rowActions}>
                            <button
                              type="button"
                              aria-label={`Edit ${user.name}`}
                              title="Edit member"
                              onClick={() => setSelected(user)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Revoke sessions for ${user.name}`}
                              title="Revoke sessions"
                              onClick={() => setRevoke(user)}
                            >
                              <ShieldCheck size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No matching members">
            Try another search or choose a different plan.
          </Empty>
        )}
        {data ? (
          <Pagination
            page={page}
            total={data.total}
            pageSize={data.pageSize}
            onChange={setPage}
          />
        ) : null}
      </section>
      {selected ? (
        <UserEditor
          key={selected.id}
          selected={selected}
          onClose={() => setSelected(null)}
          onSave={(value) => save(value)}
          busy={update.isPending}
        />
      ) : null}
      <Dialog
        open={Boolean(revoke)}
        onOpenChange={(open) => {
          if (!open && !revokeSessions.isPending) {
            setRevoke(null);
          }
        }}
      >
        <DialogContent
          className={s.modal}
          showClose={!revokeSessions.isPending}
        >
          <div className={s.modalIcon}>
            <ShieldCheck size={22} />
          </div>
          <DialogTitle>Revoke all sessions?</DialogTitle>
          <DialogDescription>
            This signs {revoke?.name} out of every device. They can sign in
            again with their existing credentials. Administrator sessions are
            protected.
          </DialogDescription>
          <div className={s.modalActions}>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={() => setRevoke(null)}
              disabled={revokeSessions.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={s.dangerButton}
              onClick={() => confirmRevoke()}
              disabled={revokeSessions.isPending}
            >
              {revokeSessions.isPending ? 'Revoking…' : 'Revoke sessions'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProfileDirectory({
  demo,
  previewProfiles,
  setPreviewProfiles,
  notify,
}: {
  demo: boolean;
  previewProfiles: AdminProfile[];
  setPreviewProfiles: (profiles: AdminProfile[]) => void;
  notify: Notice;
}) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [visibility, setVisibility] = useState<'all' | 'listed' | 'unlisted'>(
    'all'
  );
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const query = api.admin.profiles.useQuery(
    { search: debouncedSearch, page, visibility },
    { enabled: !demo }
  );
  const update = api.admin.setDiscovery.useMutation();
  const utils = api.useUtils();
  const filtered = previewProfiles.filter(
    (profile) =>
      (!debouncedSearch ||
        `${profile.name} ${profile.slug} ${profile.owner} ${profile.customDomain}`
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())) &&
      (visibility === 'all' || profile.isPublic === (visibility === 'listed'))
  );
  const data = demo
    ? {
        items: filtered.slice((page - 1) * 12, page * 12),
        total: filtered.length,
        pageSize: 12,
      }
    : query.data;
  const save = async () => {
    if (!selected) {
      return;
    }
    try {
      if (demo) {
        setPreviewProfiles(
          previewProfiles.map((profile) =>
            profile.id === selected.id
              ? { ...profile, isPublic: !selected.isPublic }
              : profile
          )
        );
      } else {
        await update.mutateAsync({
          id: selected.id,
          listed: !selected.isPublic,
        });
        await Promise.all([
          utils.admin.profiles.invalidate(),
          utils.admin.overview.invalidate(),
        ]);
      }
      notify(
        `${selected.name} ${selected.isPublic ? 'removed from' : 'added to'} Explore${demo ? ' in this preview' : ''}.`
      );
      setSelected(null);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update visibility.',
        true
      );
    }
  };
  return (
    <>
      <div className={s.infoBanner}>
        <Eye size={20} />
        <div>
          <strong>Explore visibility</strong>
          <p>
            Choose which profiles appear in Explore. Unlisted profiles remain
            accessible through their direct link.
          </p>
        </div>
      </div>
      <section className={s.panel}>
        <div className={s.directoryHeading}>
          <div>
            <h2>
              All profiles
              <span className={s.countBadge}>{number(data?.total ?? 0)}</span>
            </h2>
            <p>Manage profiles, custom domains, and discovery visibility.</p>
          </div>
          <button
            type="button"
            className={s.secondaryButton}
            disabled={!data?.items.length}
            onClick={() => {
              if (data) {
                downloadCsv(`openbio-profiles-page-${page}.csv`, [
                  [
                    'ID',
                    'Name',
                    'Slug',
                    'Owner',
                    'Listed',
                    'Custom domain',
                    'Cards',
                  ],
                  ...data.items.map((profile) => [
                    profile.id,
                    profile.name,
                    profile.slug,
                    profile.owner,
                    profile.isPublic ? 'Yes' : 'No',
                    profile.customDomain,
                    profile.cards,
                  ]),
                ]);
              }
            }}
          >
            <ArrowDownToLine size={14} />
            Export page
          </button>
        </div>
        <div className={s.filters}>
          <label className={s.searchField}>
            <Search size={16} />
            <input
              aria-label="Search profiles"
              maxLength={100}
              placeholder="Search profiles, owners, or domains…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className={s.selectLabel}>
            Discovery
            <select
              aria-label="Filter discovery visibility"
              value={visibility}
              onChange={(event) => {
                setVisibility(event.target.value as typeof visibility);
                setPage(1);
              }}
            >
              <option value="all">All profiles</option>
              <option value="listed">Listed</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
        </div>
        {!demo && (query.isPending || query.error) ? (
          <QueryState
            loading={query.isPending}
            error={query.error?.message}
            retry={() => query.refetch()}
          />
        ) : data?.items.length ? (
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Owner</th>
                  <th>Discovery</th>
                  <th>Custom domain</th>
                  <th>Cards</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((profile, i) => (
                  <tr key={profile.id}>
                    <td>
                      <div className={s.person}>
                        <Avatar name={profile.name} index={i + 2} />
                        <div>
                          <strong>{profile.name}</strong>
                          <small>/{profile.slug}</small>
                        </div>
                      </div>
                    </td>
                    <td className={s.muted}>
                      {profile.owner ?? 'Unknown owner'}
                    </td>
                    <td>
                      <span className={s.status} data-active={profile.isPublic}>
                        <i />
                        {profile.isPublic ? 'Listed' : 'Unlisted'}
                      </span>
                    </td>
                    <td>
                      <span className={s.domain}>
                        {profile.customDomain ?? '—'}
                      </span>
                    </td>
                    <td>{profile.cards}</td>
                    <td>
                      <div className={s.rowActions}>
                        <button
                          type="button"
                          aria-label={`${profile.isPublic ? 'Unlist' : 'List'} ${profile.name}`}
                          title={
                            profile.isPublic
                              ? 'Remove from Explore'
                              : 'Add to Explore'
                          }
                          onClick={() => setSelected(profile)}
                        >
                          {profile.isPublic ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                        {demo ? null : (
                          <a
                            href={`/${encodeURIComponent(profile.slug)}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${profile.name} profile`}
                          >
                            <ArrowUpRight size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No matching profiles">
            Try a different name, owner, or visibility filter.
          </Empty>
        )}
        {data ? (
          <Pagination
            page={page}
            total={data.total}
            pageSize={data.pageSize}
            onChange={setPage}
          />
        ) : null}
      </section>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !update.isPending) {
            setSelected(null);
          }
        }}
      >
        <DialogContent className={s.modal} showClose={!update.isPending}>
          <div className={s.modalIcon}>
            <CircleCheck size={22} />
          </div>
          <DialogTitle>
            {selected?.isPublic ? 'Remove from Explore?' : 'Add to Explore?'}
          </DialogTitle>
          <DialogDescription>
            {selected?.name} will{' '}
            {selected?.isPublic ? 'no longer appear' : 'appear'} in the public
            Explore directory. Their direct profile link will keep working.
            Owners can also change their discovery preference.
          </DialogDescription>
          <div className={s.modalActions}>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={() => setSelected(null)}
              disabled={update.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={s.primaryButton}
              onClick={() => save()}
              disabled={update.isPending}
            >
              {update.isPending ? 'Updating…' : 'Confirm change'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
