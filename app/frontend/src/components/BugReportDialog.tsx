import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  TextField,
  Stack,
  Typography,
} from '@mui/material';

interface BugReportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BugReportDialog({ open, onClose }: BugReportDialogProps): JSX.Element {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setStatus('sending');

    try {
      const baseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') ?? '';
      const res = await fetch(`${baseUrl}/api/bug-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), description: description.trim() }),
      });

      if (!res.ok) throw new Error();
      setStatus('success');
      setName('');
      setContact('');
      setDescription('');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 1500);
    } catch {
      setStatus('error');
    }
  };

  const handleClose = () => {
    if (status === 'sending') return;
    setStatus('idle');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Report a Bug</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">

            AiSL is still in its early stages &mdash; we&apos;re a small team of students building this on the side, so things might break. Your feedback genuinely helps us improve. You can also{' '}
            <Link
              href="https://github.com/ikranw/AiSL/issues/new"
              target="_blank"
              rel="noreferrer"
              underline="hover"
            >
              open an issue on GitHub
            </Link>
            .
          </Typography>
          {status === 'success' && <Alert severity="success">Thanks for your report!</Alert>}
          {status === 'error' && <Alert severity="error">Something went wrong. Please try again.</Alert>}
          <TextField
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Contact info (optional)"
            placeholder="Email or other way to reach you"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="What went wrong?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={status === 'sending'}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!description.trim() || status === 'sending' || status === 'success'}
        >
          {status === 'sending' ? 'Sending...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
